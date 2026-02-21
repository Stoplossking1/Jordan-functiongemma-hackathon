import fs from 'fs';
import ts from 'typescript';

import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESLint,
  TSESTree,
  type ParserServicesWithTypeInformation,
} from '@typescript-eslint/utils';
import { type RuleContext } from '@typescript-eslint/utils/ts-eslint';

const SELECT_OP = 'select';

const UNSAFE_FILTER_METHODS: Set<string> = new Set([
  // https://github.com/supabase/postgrest-js/blob/master/src/PostgrestFilterBuilder.ts#L74
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'likeAllOf',
  'likeAnyOf',
  'ilike',
  'ilikeAllOf',
  'ilikeAnyOf',
  'is',
  // 'in',
  'contains',
  'containedBy',
  'rangeGt',
  'rangeGte',
  'rangeLt',
  'rangeLte',
  'rangeAdjacent',
  'overlaps',
  'textSearch',
  // 'match',
  'not',
  // https://postgrest.org/en/stable/references/api/tables_views.html#operators
  // 'or', // we disable or for now since it requires a full parse of the filter statement
  'filter',

  // https://github.com/supabase/postgrest-js/blob/master/src/PostgrestTransformBuilder.ts#L70
  SELECT_OP,
  'order',
]);

const SUPABASE_PACKAGES = [
  '@supabase/supabase-js',
  '@supabase/postgrest-js',
  '@supabase/realtime-js',
  '@supabase/gotrue-js',
];

const SUPABASE_EXPORTS: Set<string> = new Set([
  // 'createClient',
  // 'SupabaseClient',
  // 'PostgrestClient',
  'PostgrestQueryBuilder',
  'PostgrestFilterBuilder',
  'PostgrestTransformBuilder',
]);

interface DatabaseSchema {
  tables: Record<string, TableDefinition>;
  views: Record<string, TableDefinition>;
}

interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
}

interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
}

// how much time to wait between modification checks against the database file
const DEFAULT_CACHE_REVALIDATION_INTERVAL_IN_MS = 10000;
// will be compared against all file paths, can include path names, the first found is used
const DEFAULT_DATABASE_TYPES_FILE_SUB_PATH = 'generated-db-types.ts';
// the name of the schema used in the database types file
const DEFAULT_DATABASE_TYPES_SCHEMA = 'public';

let lastCacheRevalidationInMs = 0;
let cachedDatabaseMtimeInMs: number = 0;
let cachedDatabaseSchema: DatabaseSchema | undefined = undefined;

type MessageIds = 'unsafeColumnName' | 'dynamicColumnName' | 'suggestion';

type Options = [
  {
    severity?: 'error' | 'warn';
    allowDynamicColumns?: boolean;
    cacheRevalidationIntervalInMs?: number;
    databaseTypesFileSubPath?: string;
    databaseTypesSchema?: string;
    // customSupabasePackages?: string[];
  },
];

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  //name: 'no-unsafe-supabase-filters',
  meta: {
    type: 'problem',
    docs: {
      description: 'Discourage usage of unsafe string column names in Supabase filters',
      // category: 'Best Practices',
      // recommended: false,
    },
    messages: {
      unsafeColumnName:
        'String literal column names in Supabase filters bypass TypeScript safety. Make type-safe by adding \` satisfies keyof <TableName>.',
      dynamicColumnName:
        'Dynamic string column names in Supabase filters bypass TypeScript safety. Make type-safe by using type \`keyof <TableName>\`.',
      suggestion: 'Consider defining column names as constants or using a typed schema.',
    },
    hasSuggestions: true,
    schema: [
      {
        type: 'object',
        properties: {
          severity: {
            type: 'string',
            enum: ['error', 'warn'],
            default: 'warn',
          },
          allowDynamicColumns: {
            type: 'boolean',
            default: false,
          },
          cacheRevalidationIntervalInMs: {
            type: 'number',
            default: DEFAULT_CACHE_REVALIDATION_INTERVAL_IN_MS,
          },
          databaseTypesFileSubPath: {
            type: 'string',
            default: DEFAULT_DATABASE_TYPES_FILE_SUB_PATH,
          },
          databaseTypesSchema: {
            type: 'string',
            default: DEFAULT_DATABASE_TYPES_SCHEMA,
          },
          // customSupabasePackages: {
          //   type: 'array',
          //   items: { type: 'string' },
          //   default: [],
          // },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      cacheRevalidationIntervalInMs: DEFAULT_CACHE_REVALIDATION_INTERVAL_IN_MS,
      databaseTypesFileSubPath: DEFAULT_DATABASE_TYPES_FILE_SUB_PATH,
      databaseTypesSchema: DEFAULT_DATABASE_TYPES_SCHEMA,
    },
  ],
  create(context, opt) {
    const options = opt[0] ?? {};
    const allowDynamicColumns = options.allowDynamicColumns ?? false;

    // Get TypeScript parser services
    const parserServices: ParserServicesWithTypeInformation = ESLintUtils.getParserServices(context);
    const typeChecker: ts.TypeChecker = parserServices.program.getTypeChecker();

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier
        ) {
          return;
        }

        // only find method names like `builder.order`
        const methodName = node.callee.property.name;
        if (!UNSAFE_FILTER_METHODS.has(methodName)) {
          return;
        }

        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
        // if (!ts.isCallExpression(tsNode) || !ts.isPropertyAccessExpression(tsNode.expression) || tsNode.expression.name.text !== methodName) {
        //   return;
        // }

        const signature = typeChecker.getResolvedSignature(tsNode);
        if (!signature || signature.parameters.length === 0) {
          return;
        }

        const declaration = signature.getDeclaration();
        if (!declaration) {
          return;
        }

        if (!matchesModuleAndClass(declaration, SUPABASE_PACKAGES, SUPABASE_EXPORTS)) {
          return;
        }

        if (methodName === SELECT_OP) {
          // TODO: parse query and store result
          return;
        }
        const argumentIndex = 0; // TODO: set this value according to found function

        // if it's using a type other than string, we are done already
        if (!isStringTypeAtIndex(declaration, argumentIndex)) {
          return;
        }

        const arg = node.arguments[argumentIndex];
        if (!arg) {
          return;
        }

        if (tsNode.arguments.length <= argumentIndex) {
          return undefined;
        }

        const argTs = tsNode.arguments[argumentIndex];

        // isTypeSafe: rowType ? isColumnName(literalType.value, rowType, typeChecker) : false,

        const result = analyzeExpressionWithTsAst(argTs, typeChecker);
        // processOrderCall(result);
        // console.log(`${methodName}(${argTs.getText()}): ${JSON.stringify(result)}`);

        const result2 = analyzeExpressionWithEsLintAst(arg, context);
        // processOrderCall(result2);
        // console.log(`${methodName}(${argTs.getText()}): ${JSON.stringify(result2)}`);
        // console.log('\n');

        const databaseSchema = getOrExtractDatabaseSchema(
          options.cacheRevalidationIntervalInMs ?? DEFAULT_CACHE_REVALIDATION_INTERVAL_IN_MS,
          options.databaseTypesFileSubPath ?? DEFAULT_DATABASE_TYPES_FILE_SUB_PATH,
          options.databaseTypesSchema ?? DEFAULT_DATABASE_TYPES_SCHEMA,
          parserServices.program,
          typeChecker,
        );

        // TODO: Now validate against the loaded schema
        if (databaseSchema) {
          //validateSupabaseQuery(node, databaseSchema);
        }

        if (result == null) {
          return;
        }

        // Check for string literal
        if (result.type === 'string-literal' || result.type === 'string-type-literal') {
          context.report({
            node: arg,
            messageId: 'unsafeColumnName',
            data: {
              method: methodName,
              column: result.value,
            },
            // suggest: [
            //   {
            //     messageId: 'suggestion',
            //     fix(fixer) {
            //       const columnName = arg.value;
            //       const constantName = columnName
            //         .replace(/[^a-zA-Z0-9]/g, '_')
            //         .replace(/([a-z])([A-Z])/g, '$1_$2')
            //         .toUpperCase();
            //       return fixer.replaceText(arg, `COLUMNS.${constantName}`);
            //     },
            //   },
            // ],
          });
        } else if (result.type === 'string-variable' || result.type === 'string-type-variable') {
          context.report({
            node: arg,
            messageId: 'dynamicColumnName',
            data: {
              method: methodName,
              column: result.variableName,
            },
          });
        }

        // // Check for dynamic expressions
        // if (
        //   !allowDynamicColumns &&
        //   arg.type !== AST_NODE_TYPES.Identifier &&
        //   arg.type !== AST_NODE_TYPES.MemberExpression
        // ) {
        //   if (
        //     arg.type === AST_NODE_TYPES.TemplateLiteral ||
        //     arg.type === AST_NODE_TYPES.BinaryExpression ||
        //     arg.type === AST_NODE_TYPES.CallExpression
        //   ) {
        //     context.report({
        //       node: arg,
        //       messageId: 'dynamicColumnName',
        //       data: {
        //         method: methodName,
        //       },
        //     });
        // }
        // }
      },
    };
  },
});

function getOrExtractDatabaseSchema(
  cacheRevalidationIntervalInMs: number,
  databaseTypesFileSubPath: string,
  databaseTypesSchema: string,
  program: ts.Program,
  typeChecker: ts.TypeChecker,
): DatabaseSchema | undefined {
  const now = Date.now();
  if (now - lastCacheRevalidationInMs > cacheRevalidationIntervalInMs) {
    console.log(`Revalidate the cache, last update: ${lastCacheRevalidationInMs}`);
    lastCacheRevalidationInMs = now;
    // Find the database types file
    const dbSourceFile = program.getSourceFiles().find((file) => file.fileName.includes(databaseTypesFileSubPath));
    if (dbSourceFile) {
      try {
        // filename is absolute
        const stat = fs.statSync(dbSourceFile.fileName);
        // was the database file modified?
        const mTimeInMs = stat.mtime.getTime();
        if (mTimeInMs > cachedDatabaseMtimeInMs) {
          console.log(`Database file has changed, reloading: "${databaseTypesFileSubPath}"`);

          cachedDatabaseMtimeInMs = mTimeInMs;
          cachedDatabaseSchema = extractDatabaseSchema(dbSourceFile, databaseTypesSchema, typeChecker);
        }
      } catch (e) {
        console.log(
          `Skipping validation, failed loading or parsing database file: "${databaseTypesFileSubPath}"\n${e instanceof Error ? e.message : JSON.stringify(e)}`,
        );
      }
    }
  }

  return cachedDatabaseSchema;
}

function extractDatabaseSchema(
  dbTypesFile: ts.SourceFile,
  databaseTypesSchema: string,
  typeChecker: ts.TypeChecker,
): DatabaseSchema {
  // Find the Database type alias
  const databaseTypeAlias = findDatabaseTypeAlias(dbTypesFile);

  // Extract the schema structure
  return parseDatabaseType(databaseTypesSchema, databaseTypeAlias, typeChecker);
}

function findDatabaseTypeAlias(sourceFile: ts.SourceFile): ts.TypeAliasDeclaration {
  let databaseType: ts.TypeAliasDeclaration | undefined = undefined;

  function visit(node: ts.Node) {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === 'Database') {
      databaseType = node;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!databaseType) {
    throw new Error('Cannot find `type Database`');
  }
  return databaseType;
}

function parseDatabaseType(
  databaseTypesSchema: string,
  typeAlias: ts.TypeAliasDeclaration,
  checker: ts.TypeChecker,
): DatabaseSchema {
  const type = checker.getTypeAtLocation(typeAlias);
  const publicSchema = type.getProperty(databaseTypesSchema);

  if (!publicSchema) {
    throw new Error('No public schema found in `type Database`');
  }

  const publicType = checker.getTypeOfSymbolAtLocation(publicSchema, typeAlias);
  const tablesProperty = publicType.getProperty('Tables');
  const viewsProperty = publicType.getProperty('Views');

  const schema: DatabaseSchema = {
    tables: {},
    views: {},
  };

  // Extract Tables
  if (tablesProperty) {
    const tablesType = checker.getTypeOfSymbolAtLocation(tablesProperty, typeAlias);
    schema.tables = extractTableDefinitions(tablesType, checker);
  }

  // Extract Views
  if (viewsProperty) {
    const viewsType = checker.getTypeOfSymbolAtLocation(viewsProperty, typeAlias);
    schema.views = extractTableDefinitions(viewsType, checker);
  }

  return schema;
}

function extractTableDefinitions(tablesType: ts.Type, checker: ts.TypeChecker): Record<string, TableDefinition> {
  const tables: Record<string, TableDefinition> = {};
  const properties = checker.getPropertiesOfType(tablesType);

  for (const prop of properties) {
    const tableName = prop.getName();
    const tableType = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);

    // Get Row, Insert, Update types
    const rowProperty = tableType.getProperty('Row');
    const insertProperty = tableType.getProperty('Insert');
    const updateProperty = tableType.getProperty('Update');

    if (rowProperty) {
      const rowType = checker.getTypeOfSymbolAtLocation(rowProperty, prop.valueDeclaration!);
      const columns = checker.getPropertiesOfType(rowType);

      tables[tableName] = {
        name: tableName,
        columns: columns.map((col) => ({
          name: col.getName(),
          type: checker.typeToString(checker.getTypeOfSymbolAtLocation(col, col.valueDeclaration!)),
          nullable: col.valueDeclaration
            ? checker.getTypeOfSymbolAtLocation(col, col.valueDeclaration!).isUnion()
            : false,
        })),
      };
    }
  }

  return tables;
}

type ExpressionType = {
  type: 'keyof' | 'reference' | 'string' | 'other';
  operand?: string;
  name?: string;
};

function analyzeType(
  variableName: string | undefined,
  value: string | undefined,
  isVariable: boolean,
  isAsserted: boolean,
  expressionType: ExpressionType,
): AnalyzedExpression {
  switch (expressionType.type) {
    case 'string':
      // orderNameTypedString: string = 'createdAt';
      // orderNameTypedString = 'createdAt as string';
      // orderNameTypedString = 'createdAt satisfies string';
      return {
        type: isVariable ? 'string-type-variable' : 'string-type-literal',
        variableName: variableName,
        value: value,
        typeName: expressionType.operand,
        hasTypeAssertion: isAsserted,
      };
    case 'keyof':
      // orderNameTypedString: keyof ConversationMessage = 'createdAt';
      // orderNameTypedString = 'createdAt' as keyof ConversationMessage;
      // orderNameTypedString = 'createdAt' satisfies keyof ConversationMessage;
      return {
        type: isVariable ? 'keyof-type-variable' : 'keyof-type-literal',
        variableName: variableName,
        value: value,
        typeName: expressionType.operand,
        // possibleValues: literalValues,
        hasTypeAssertion: isAsserted,
      };
    case 'reference':
    case 'other':
      return {
        type: isVariable ? 'other-type-variable' : 'other-type-literal',
        variableName: variableName,
        value: value,
        typeName: expressionType.operand,
        hasTypeAssertion: isAsserted,
      };

    default:
      break;
  }

  return {
    type: isVariable ? 'unknown-type-variable' : 'unknown-type-literal',
    variableName: variableName,
    value: value,
    typeName: expressionType.operand,
    hasTypeAssertion: isAsserted,
  };
}

type AnalyzedExpressionType =
  | 'string-literal'
  | 'string-type-literal'
  | 'keyof-type-literal'
  | 'other-type-literal'
  | 'unknown-type-literal'
  | 'string-variable'
  | 'string-type-variable'
  | 'keyof-type-variable'
  | 'other-type-variable'
  | 'unknown-type-variable'
  | 'template-literal-variable';

interface AnalyzedExpression {
  type: AnalyzedExpressionType;
  value?: string | number | bigint | boolean | RegExp | null;
  variableName?: string;
  typeName?: string;
  possibleValues?: string[];
  hasTypeAssertion: boolean;
}

function analyzeExpressionWithEsLintAst(
  node: TSESTree.Node,
  context: Readonly<RuleContext<MessageIds, Options>>,
): AnalyzedExpression | undefined {
  if (node.type === AST_NODE_TYPES.Identifier) {
    const scope = context.sourceCode.getScope(node);
    const variable = findVariable(scope, node.name); //scope.set.get(node.name);

    if (variable && variable.defs.length) {
      const def = variable.defs[0];
      // Check the definition type
      // def.type === 'Variable' &&
      if (def.node.type === AST_NODE_TYPES.VariableDeclarator) {
        const declarator = def.node;
        const value =
          declarator.init?.type === AST_NODE_TYPES.Literal && typeof declarator.init.value === 'string'
            ? declarator.init.value
            : undefined;
        // # Identifier Case 1:
        // const orderNameTypedString: string = 'createdAt';
        //                           ˆˆˆˆˆˆˆˆ
        // const { data, error } = await supabaseClient
        //   .from('Conversation')
        //   .select(`messages:ConversationMessage(*)`)
        //   .order(orderNameTypedString, { ascending: true, referencedTable: 'messages' });
        //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
        // # Identifier Case 2:
        // const orderNameTypedKeyOf: keyof ConversationMessage = 'createdAt';
        //                          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
        // const { data, error } = await supabaseClient
        //   .from('Conversation')
        //   .select(`messages:ConversationMessage(*)`)
        //   .order(orderNameTypedKeyOf, { ascending: true, referencedTable: 'messages' });
        //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
        if (declarator.id.typeAnnotation) {
          return analyzeType(node.name, value, true, false, analyzeTypeAnnotation(declarator.id.typeAnnotation));
        }

        // Check for 'as' or 'satisfies' expression
        if (
          declarator.init &&
          (declarator.init.type === AST_NODE_TYPES.TSAsExpression ||
            declarator.init.type === AST_NODE_TYPES.TSSatisfiesExpression)
        ) {
          // # Identifier Case 3:
          // const orderNameAsString = 'createdAt' as string;
          //                                       ˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameAsString, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          // # Identifier Case 4:
          // const orderNameAsKeyOf = 'createdAt' as keyof ConversationMessage;
          //                                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameAsKeyOf, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          // # Identifier Case 5:
          // const orderNameSatisfiesString = 'createdAt' satisfies string;
          //                                             ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameSatisfiesString, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          // # Identifier Case 6:
          // const orderNameSatisfiesKeyOf = 'createdAt' satisfies keyof ConversationMessage;
          //                                             ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameSatisfiesKeyOf, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          return analyzeType(
            node.name,
            value,
            true,
            declarator.init.type === AST_NODE_TYPES.TSAsExpression,
            analyzeTypeAnnotation(declarator.init.typeAnnotation),
          );
        }
      }
    }
    // # Identifier Case 7:
    // const orderNameUntyped = 'createdAt';
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order(orderNameUntyped, { ascending: true, referencedTable: 'messages' });
    return {
      type: 'string-variable',
      variableName: node.name,
      // value: literalType.value,
      hasTypeAssertion: false,
    };
  } else if (node.type === AST_NODE_TYPES.TSSatisfiesExpression || node.type === AST_NODE_TYPES.TSAsExpression) {
    // # Literal Case 1:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' satisfies string, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
    // # Literal Case 2:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' satisfies keyof ConversationMessage, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
    // # Literal Case 3:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' as string, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆ
    // # Literal Case 4:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' as keyof ConversationMessage, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
    const columnName =
      node.expression.type == AST_NODE_TYPES.Literal && typeof node.expression.value === 'string'
        ? node.expression.value
        : undefined;
    return analyzeType(
      undefined,
      columnName,
      false,
      node.type === AST_NODE_TYPES.TSAsExpression,
      analyzeTypeAnnotation(node.typeAnnotation),
    );
  } else if (node.type === AST_NODE_TYPES.Literal) {
    // # Literal Case 5:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt', { ascending: true, referencedTable: 'messages' });
    //           ˆˆˆˆˆˆˆˆˆ literal defined in the call
    return {
      type: 'string-literal',
      value: node.value,
      hasTypeAssertion: false,
    };
  }
}

function findVariable(scope: TSESLint.Scope.Scope, name: string): TSESLint.Scope.Variable | undefined {
  // Look in current scope
  // for (const variable of scope.variables) {
  //   if (variable.name === name) return variable;
  // }
  const variable = scope.set.get(name);
  if (variable != null) {
    return variable;
  }

  // Look in parent scopes
  if (scope.upper) {
    return findVariable(scope.upper, name);
  }

  return undefined;
}

function analyzeTypeAnnotation(typeAnnotation: TSESTree.TSTypeAnnotation | TSESTree.TypeNode): ExpressionType {
  const typeNode =
    typeAnnotation.type === AST_NODE_TYPES.TSTypeAnnotation ? typeAnnotation.typeAnnotation : typeAnnotation;

  switch (typeNode.type) {
    case AST_NODE_TYPES.TSTypeOperator:
      if (typeNode.operator === 'keyof') {
        return {
          type: 'keyof',
          operand:
            typeNode.typeAnnotation?.type === AST_NODE_TYPES.TSTypeReference
              ? getTypeReferenceName(typeNode.typeAnnotation)
              : undefined,
        };
      }
      break;

    case AST_NODE_TYPES.TSTypeReference:
      return {
        type: 'reference',
        name: getTypeReferenceName(typeNode),
      };

    case AST_NODE_TYPES.TSStringKeyword:
      return { type: 'string' };

    // Add more cases as needed
    default:
  }
  return { type: 'other' };
}

function getTypeReferenceName(node: TSESTree.TSTypeReference): string | undefined {
  if (node.typeName.type === AST_NODE_TYPES.Identifier) {
    return node.typeName.name;
  }
  // Handle qualified names like A.B.C
  if (node.typeName.type === AST_NODE_TYPES.TSQualifiedName) {
    return getQualifiedName(node.typeName);
  }
  return undefined;
}

function getQualifiedName(node: TSESTree.TSQualifiedName): string {
  const left =
    node.left.type === AST_NODE_TYPES.Identifier
      ? node.left.name
      : getQualifiedName(node.left as TSESTree.TSQualifiedName);

  const right = node.right.name;

  return `${left}.${right}`;
}

function isStringTypeAtIndex(declaration: ts.SignatureDeclaration, index: number): boolean {
  // Check the parameter declaration directly
  if (ts.isFunctionLike(declaration) && declaration.parameters.length > index) {
    const param = declaration.parameters[index];
    if (param.type) {
      const typeText = param.type.getText();

      // The string overload will have "string" as the type
      // The generic overload will have "ColumnName" or similar
      return typeText === 'string';
    }
  }

  return false;
}

function matchesModuleAndClass(
  declaration: ts.SignatureDeclaration,
  moduleSubPaths: string[],
  classNames: Set<string>,
): boolean {
  // Find the containing class of this method
  let parent = declaration.parent;
  while (parent) {
    if (ts.isClassDeclaration(parent) && parent.name) {
      const isWantedClass = classNames.has(parent.name.text);
      if (!isWantedClass) {
        return false;
      }

      const fileName = parent.getSourceFile().fileName;
      const isCorrectModule = moduleSubPaths.some((moduleSubPath) => fileName.includes(moduleSubPath));
      return isCorrectModule;
    }
    parent = parent.parent;
  }

  return false;
}
function isColumnName(columnName: string, rowType: ts.Type, typeChecker: ts.TypeChecker): boolean {
  if (!rowType) return false;

  const properties = typeChecker.getPropertiesOfType(rowType);
  return properties.some((prop) => prop.name === columnName);
}

function analyzeKeyOfUsage(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  isIdentifier: boolean,
  variableName?: string,
  value?: string,
): AnalyzedExpression | undefined {
  // Check if it's a union of string literals (common for keyof)
  if (type.flags & ts.TypeFlags.Union) {
    const unionType = type as ts.UnionType;
    const allStringLiterals = unionType.types.every((type) => type.flags & ts.TypeFlags.StringLiteral);
    if (allStringLiterals) {
      const literalValues = unionType.types.map((t) => (t as ts.StringLiteralType).value);

      // Likely a keyof type
      return {
        type: isIdentifier ? 'keyof-type-variable' : 'keyof-type-literal',
        variableName,
        value,
        possibleValues: literalValues,
        hasTypeAssertion: false,
      };
    }
  }

  const typeString = typeChecker.typeToString(type);
  // Check if the declared type string indicates keyof
  if (typeString.includes('keyof')) {
    return {
      type: isIdentifier ? 'keyof-type-variable' : 'keyof-type-literal',
      variableName,
      value,
      hasTypeAssertion: false,
    };
  }

  return undefined;
}

function analyzeTypeAnnotationTs(typeNode: ts.TypeNode, typeChecker: ts.TypeChecker): ExpressionType {
  if (ts.isTypeOperatorNode(typeNode)) {
    // Check for keyof type operator

    if (typeNode.operator === ts.SyntaxKind.KeyOfKeyword) {
      return {
        type: 'keyof',
        operand: ts.isTypeReferenceNode(typeNode.type) ? getTypeReferenceNameTs(typeNode.type) : undefined,
      };
    }
  } else if (ts.isTypeReferenceNode(typeNode)) {
    // Check for type reference that might be a keyof type
    const typeName = typeChecker.typeToString(typeChecker.getTypeFromTypeNode(typeNode));
    if (typeName.includes('keyof')) {
      return {
        type: 'keyof',
        name: getTypeReferenceNameTs(typeNode),
      };
    }
    return {
      type: 'reference',
      name: getTypeReferenceNameTs(typeNode),
    };
  } else if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
    return { type: 'string' };
  }
  return { type: 'other' };
}

function getTypeReferenceNameTs(node: ts.TypeReferenceNode): string | undefined {
  if (ts.isIdentifier(node.typeName)) {
    return node.typeName.text;
  }
  // Handle qualified names like A.B.C
  if (ts.isQualifiedName(node.typeName)) {
    return getQualifiedNameTs(node.typeName);
  }
  return undefined;
}

function getQualifiedNameTs(node: ts.QualifiedName): string {
  const left = ts.isIdentifier(node.left) ? node.left.text : getQualifiedNameTs(node.left);

  const right = node.right.text;

  return `${left}.${right}`;
}

function analyzeExpressionWithTsAst(node: ts.Expression, typeChecker: ts.TypeChecker): AnalyzedExpression | undefined {
  // Step 1: validation using purely on the visible casts.
  // We can rather let typescript do this and only read the final version from the flags
  // which is done in the second part, which also handles literal symbols
  const res = analyzeArgumentTypeWithTsStaticAst(node, typeChecker, true);
  if (res) {
    return res;
  }
  // Step 2: this code-path by default only covers the string literals and string typed variables
  // If we disable Step 1 above, it can also cover most of it's cases
  // The only missing part is that we can't distinguish string literals from "typed" versions
  // e.g. `'hi'` vs. `'hi' satisifies keyof MyType` will both result in a string literal
  // for advanced parsing we want to be able to distinguish both
  return analyzeArgumentTypeWithTsInferedTypesAst(node, typeChecker);
}

function analyzeArgumentTypeWithTsStaticAst(
  node: ts.Expression,
  typeChecker: ts.TypeChecker,
  handleUntypedCases: boolean,
): AnalyzedExpression | undefined {
  if (ts.isIdentifier(node)) {
    // If it's an identifier (variable reference), check its declaration
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (symbol && symbol.valueDeclaration) {
      const declaration = symbol.valueDeclaration;

      // Check if it's a variable declaration with explicit type annotation
      if (ts.isVariableDeclaration(declaration)) {
        if (declaration.type) {
          const value =
            declaration.initializer && ts.isLiteralExpression(declaration.initializer)
              ? declaration.initializer.text
              : undefined;
          const typeNode = declaration.type;

          // # Identifier Case 1:
          // const orderNameTypedString: string = 'createdAt';
          //                           ˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameTypedString, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          // # Identifier Case 2:
          // const orderNameTypedKeyOf: keyof ConversationMessage = 'createdAt';
          //                          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameTypedKeyOf, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          return analyzeType(node.text, value, true, false, analyzeTypeAnnotationTs(typeNode, typeChecker));
        }

        // Check for 'as' or 'satisfies' expression
        if (
          declaration.initializer &&
          (ts.isAsExpression(declaration.initializer) || ts.isSatisfiesExpression(declaration.initializer))
        ) {
          const value = ts.isLiteralExpression(declaration.initializer.expression)
            ? declaration.initializer.expression.text
            : undefined;
          const typeNode = declaration.initializer.type;
          // # Identifier Case 3:
          // const orderNameAsString = 'createdAt' as string;
          //                                       ˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameAsString, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          // # Identifier Case 4:
          // const orderNameAsKeyOf = 'createdAt' as keyof ConversationMessage;
          //                                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameAsKeyOf, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          // # Identifier Case 5:
          // const orderNameSatisfiesString = 'createdAt' satisfies string;
          //                                             ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameSatisfiesString, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          // # Identifier Case 6:
          // const orderNameSatisfiesKeyOf = 'createdAt' satisfies keyof ConversationMessage;
          //                                             ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
          // const { data, error } = await supabaseClient
          //   .from('Conversation')
          //   .select(`messages:ConversationMessage(*)`)
          //   .order(orderNameSatisfiesKeyOf, { ascending: true, referencedTable: 'messages' });
          //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier
          return analyzeType(
            node.text,
            value,
            true,
            ts.isAsExpression(declaration.initializer),
            analyzeTypeAnnotationTs(typeNode, typeChecker),
          );
        }

        if (declaration.initializer && ts.isLiteralExpression(declaration.initializer)) {
          if (handleUntypedCases) {
            // At this point the only case left should be a string variable, which is handled with the fall-through
            // # Identifier Case 7:
            // const orderNameUntyped = 'createdAt';
            //                           ˆˆˆˆˆˆˆˆˆ No type just a literal
            // const { data, error } = await supabaseClient
            //   .from('Conversation')
            //   .select(`messages:ConversationMessage(*)`)
            //   .order(orderNameUntyped, { ascending: true, referencedTable: 'messages' });
            //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
            return {
              type: 'string-variable',
              variableName: node.text,
              // value: literalType.value,
              hasTypeAssertion: false,
            };
          }
        } else {
          console.log(`UNSUPPORTED variable declaration case: ${declaration.getText()}`);
        }
      } else {
        console.log(`UNSUPPORTED value declaration case: ${declaration.getText()}`);
      }
    } else {
      console.log(`UNSUPPORTED No value declaration case: ${node.text}`);
    }
  } else if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    // # Literal Case 1:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' satisfies string, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
    // # Literal Case 2:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' satisfies keyof ConversationMessage, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
    // # Literal Case 3:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' as string, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆ
    // # Literal Case 4:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt' as keyof ConversationMessage, { ascending: true, referencedTable: 'messages' });
    //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ         ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
    const columnName = ts.isStringLiteral(node.expression) ? node.expression.text : undefined;
    return analyzeType(
      undefined,
      columnName,
      false,
      ts.isAsExpression(node),
      analyzeTypeAnnotationTs(node.type, typeChecker),
    );
  } else if (ts.isLiteralExpression(node)) {
    if (handleUntypedCases) {
      // # Literal Case 5:
      // const { data, error } = await supabaseClient
      //   .from('Conversation')
      //   .select(`messages:ConversationMessage(*)`)
      //   .order('createdAt', { ascending: true, referencedTable: 'messages' });
      //           ˆˆˆˆˆˆˆˆˆ literal defined in the call
      return {
        type: 'string-literal',
        value: node.text,
        hasTypeAssertion: false,
      };
    }
  } else {
    console.log(`UNSUPPORTED expression: ${node.getText()}`);
  }
  return undefined;
}

function analyzeArgumentTypeWithTsInferedTypesAst(
  node: ts.Expression,
  typeChecker: ts.TypeChecker,
): AnalyzedExpression | undefined {
  // Get the type of the argument as fallback
  const type = typeChecker.getTypeAtLocation(node);
  const variableName = ts.isPropertyAccessExpression(node)
    ? node.name.text
    : ts.isIdentifier(node)
      ? node.text
      : undefined;
  let value: string | undefined = undefined;
  if (ts.isIdentifier(node)) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (symbol && symbol.valueDeclaration) {
      const declaration = symbol.valueDeclaration;
      const declaredType = typeChecker.getTypeOfSymbolAtLocation(symbol, declaration);
      value =
        ts.isVariableDeclaration(declaration) &&
        declaration.initializer &&
        ts.isLiteralExpression(declaration.initializer)
          ? declaration.initializer.text
          : undefined;

      // # Identifier Case 2:
      // const orderNameTypedKeyOf: keyof ConversationMessage = 'createdAt';
      //                          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
      // const { data, error } = await supabaseClient
      //   .from('Conversation')
      //   .select(`messages:ConversationMessage(*)`)
      //   .order(orderNameTypedKeyOf, { ascending: true, referencedTable: 'messages' });
      //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ Identifier

      // check the contextual type or constraint
      const keyOfRes = analyzeKeyOfUsage(
        declaredType,
        typeChecker,
        ts.isIdentifier(node),
        variableName,
        ts.isIdentifier(node) ? node.text : value,
      );
      if (keyOfRes) {
        return keyOfRes;
      }
    }
  } else if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    if (ts.isStringLiteral(node.expression)) {
      // # Literal Case 1:
      // const { data, error } = await supabaseClient
      //   .from('Conversation')
      //   .select(`messages:ConversationMessage(*)`)
      //   .order('createdAt' satisfies string, { ascending: true, referencedTable: 'messages' });
      //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
      // # Literal Case 2:
      // const { data, error } = await supabaseClient
      //   .from('Conversation')
      //   .select(`messages:ConversationMessage(*)`)
      //   .order('createdAt' satisfies keyof ConversationMessage, { ascending: true, referencedTable: 'messages' });
      //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
      // # Literal Case 3:
      // const { data, error } = await supabaseClient
      //   .from('Conversation')
      //   .select(`messages:ConversationMessage(*)`)
      //   .order('createdAt' as string, { ascending: true, referencedTable: 'messages' });
      //                      ˆˆˆˆˆˆˆˆˆ
      // # Literal Case 4:
      // const { data, error } = await supabaseClient
      //   .from('Conversation')
      //   .select(`messages:ConversationMessage(*)`)
      //   .order('createdAt' as keyof ConversationMessage, { ascending: true, referencedTable: 'messages' });
      //                      ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
      value = node.expression.text;
    }
  } else if (ts.isStringLiteral(node)) {
    // # Literal Case 5:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt', { ascending: true, referencedTable: 'messages' });
    //           ˆˆˆˆˆˆˆˆˆ literal defined in the call
    value = node.text;
  }

  const keyOfRes = analyzeKeyOfUsage(type, typeChecker, ts.isIdentifier(node), variableName, value);
  if (keyOfRes) {
    return keyOfRes;
  }

  // Check if it's a plain string type
  if (type.flags & ts.TypeFlags.String) {
    // # Literal Case 1:
    // # Identifier Case 1
    return {
      type: ts.isIdentifier(node) ? 'string-type-variable' : 'string-type-literal',
      variableName,
      value: ts.isIdentifier(node) ? node.text : value,
      hasTypeAssertion: false,
    };
  }

  // Single string literal could be either - without declaration context, assume string
  if (type.flags & ts.TypeFlags.StringLiteral) {
    // # Identifier Case 7:
    // const orderNameUntyped = 'createdAt';
    //                           ˆˆˆˆˆˆˆˆˆ No type just a literal
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order(orderNameUntyped, { ascending: true, referencedTable: 'messages' });
    //          ˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆˆ
    // # Literal Case 5:
    // const { data, error } = await supabaseClient
    //   .from('Conversation')
    //   .select(`messages:ConversationMessage(*)`)
    //   .order('createdAt', { ascending: true, referencedTable: 'messages' });
    //           ˆˆˆˆˆˆˆˆˆ literal defined in the call
    const literalType = type as ts.StringLiteralType;
    return {
      type: ts.isIdentifier(node) ? 'string-variable' : 'string-literal',
      variableName,
      value: literalType.value,
      hasTypeAssertion: false,
    };
  }

  // Check if it's a template literal type
  if (type.flags & ts.TypeFlags.TemplateLiteral) {
    return {
      type: 'template-literal-variable',
      variableName,
      hasTypeAssertion: false,
    };
  }

  return {
    type: 'unknown-type-literal',
    variableName,
    hasTypeAssertion: false,
  };
}
