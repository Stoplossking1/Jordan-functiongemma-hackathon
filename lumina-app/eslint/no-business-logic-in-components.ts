import path from 'path';

import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { type RuleContext } from '@typescript-eslint/utils/ts-eslint';

type MessageIds = 'businessLogicHooks' | 'businessLogicFunctions';

type Options = [];

// list of name spaces we want to cover
function isReactNamespaceIdentifier(identifier: TSESTree.EntityName): boolean {
  return identifier.type === AST_NODE_TYPES.Identifier && ['React', 'JSX'].includes(identifier.name);
}

// list of Types that are allowed (with or without namespaces for simplicity)
function isReactTypeIdentifier(identifier: TSESTree.EntityName): boolean {
  return identifier.type === AST_NODE_TYPES.Identifier && ['ReactNode', 'FC', 'Element'].includes(identifier.name);
}

function isHookFunction(node: TSESTree.Expression): boolean {
  return (
    node.type === AST_NODE_TYPES.Identifier &&
    ['useState', 'useEffect', 'useMemo', 'useCallback', 'useReducer'].includes(node.name)
  );
}

export default ESLintUtils.RuleCreator.withoutDocs<Options, MessageIds>({
  //name: 'no-business-logic-in-components',
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent business logic in component files',
    },
    messages: {
      businessLogicHooks: 'Business logic hook "{{hookName}}" should be used in file "{{filenameNoSuffix}}Func.ts"',
      businessLogicFunctions:
        'Functions in "{{filename}}" may only create React Components. Business logic function "{{functionName}}" should be in "{{filenameNoSuffix}}Func.ts"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = path.basename(context.filename);
    const isFileToCheck =
      filename.endsWith('.tsx') &&
      //exclude hook definitions
      !filename.startsWith('use') &&
      // exclude all e.g. StyleContext.tsx
      !filename.endsWith('Context.tsx');
    // check all files that are named <something>Container.tsx
    // filename.endsWith('Container.tsx');
    return isFileToCheck
      ? {
          //simplify logic, only search the AST if the filename qualifies
          CallExpression(node) {
            if (node.callee.type === AST_NODE_TYPES.Identifier && isHookFunction(node.callee)) {
              context.report({
                node,
                messageId: 'businessLogicHooks',
                data: {
                  filename,
                  filenameNoSuffix: path.basename(context.filename, '.tsx'),
                  hookName: node.callee.name,
                },
              });
            }
          },

          // Check for function declarations at root level
          FunctionDeclaration(node) {
            // Only check functions at the program level (not nested)
            if (node.parent.type === AST_NODE_TYPES.Program) {
              handleFunction(node, context);
            }
          },

          ExportDefaultDeclaration(node) {
            if (node.declaration.type === AST_NODE_TYPES.FunctionDeclaration) {
              handleFunction(node.declaration, context);
            }
            // default exporting arrow functions already caught by the VariableDeclaration handler
          },

          // Check for exported function expressions and arrow functions
          ExportNamedDeclaration(node) {
            if (node.declaration) {
              // Named export with function declaration
              if (node.declaration.type === AST_NODE_TYPES.FunctionDeclaration) {
                handleFunction(node.declaration, context);
              }
              // Named export with variable declaration (arrow functions, function expressions)
              else if (node.declaration.type === AST_NODE_TYPES.VariableDeclaration) {
                handleVariableDeclaration(node.declaration, context);
              }
            }
          },
          // Check for variable declarations with function expressions at root level
          VariableDeclaration(node) {
            // Only check variables at the program level (not nested)
            if (node.parent.type === AST_NODE_TYPES.Program) {
              handleVariableDeclaration(node, context);
            }
          },
        }
      : {};
  },
});

function isReactTypeReference(typeName: TSESTree.EntityName): boolean {
  // Handle direct identifiers: ReactNode, FC, etc.
  if (isReactTypeIdentifier(typeName)) {
    return true;
  }

  // Handle qualified names: React.ReactNode, React.FC, etc.
  if (typeName.type === AST_NODE_TYPES.TSQualifiedName) {
    const qualified = typeName;
    if (isReactNamespaceIdentifier(qualified.left) && isReactTypeIdentifier(qualified.right)) {
      return true;
    }
  }

  return false;
}

function handleVariableDeclaration(
  node: TSESTree.LetOrConstOrVarDeclaration | TSESTree.UsingDeclaration,
  context: Readonly<RuleContext<MessageIds, Options>>,
) {
  for (const declarator of node.declarations) {
    if (
      declarator.init &&
      (declarator.init.type === AST_NODE_TYPES.FunctionExpression ||
        declarator.init.type === AST_NODE_TYPES.ArrowFunctionExpression)
    ) {
      // Check if the variable has React.FC type annotation
      if (
        declarator.id.type === AST_NODE_TYPES.Identifier &&
        declarator.id.typeAnnotation?.typeAnnotation?.type === AST_NODE_TYPES.TSTypeReference &&
        isReactTypeReference(declarator.id.typeAnnotation.typeAnnotation.typeName)
      ) {
        continue; // Skip React.FC components
      }

      handleFunction(declarator.init, context, declarator);
    }
  }
}

function handleFunction(
  node:
    | TSESTree.FunctionDeclarationWithName
    | TSESTree.FunctionDeclarationWithOptionalName
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression,
  context: Readonly<RuleContext<MessageIds, Options>>,
  targetNode?: TSESTree.Node, // for variable declarators
) {
  const isReactComponent =
    node.returnType?.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
    isReactTypeReference(node.returnType.typeAnnotation.typeName);

  if (!isReactComponent) {
    // Extract function name
    let functionName = '<anonymous>';

    if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
      functionName = node.id.name;
    } else if (node.type === AST_NODE_TYPES.FunctionExpression && node.id) {
      functionName = node.id.name;
    } else if (
      targetNode &&
      targetNode.type === AST_NODE_TYPES.VariableDeclarator &&
      targetNode.id.type === AST_NODE_TYPES.Identifier
    ) {
      // For arrow functions and function expressions assigned to variables
      functionName = targetNode.id.name;
    }

    context.report({
      node: targetNode ?? node,
      messageId: 'businessLogicFunctions',
      data: {
        filename: path.basename(context.filename),
        filenameNoSuffix: path.basename(context.filename, '.tsx'),
        functionName,
      },
    });
  }
}
