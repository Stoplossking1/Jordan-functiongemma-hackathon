import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';

export default ESLintUtils.RuleCreator.withoutDocs({
  //name: 'explicit-return-type-when-returns',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require explicit return type when function has return statement',
      // category: 'TypeScript',
      // recommended: false,
    },
    messages: {
      missingReturnType: 'Function with return statement must have an explicit return type',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function hasReturnStatement(
      node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
    ) {
      let hasReturn = false;
      const visited = new WeakSet();
      const queue: Array<TSESTree.Node | null> = [node.body];

      while (queue.length > 0 && !hasReturn) {
        const current = queue.shift();

        // Skip if already visited or null/undefined
        if (!current || visited.has(current)) continue;
        visited.add(current);

        // Check if this is a return statement with a value
        if (current.type === AST_NODE_TYPES.ReturnStatement && current.argument) {
          hasReturn = true;
          break;
        }

        // Don't traverse into nested functions
        if (
          current.type === AST_NODE_TYPES.FunctionDeclaration ||
          current.type === AST_NODE_TYPES.FunctionExpression
          // current.type === 'ArrowFunctionExpression'
        ) {
          continue;
        }

        // Add child nodes to queue
        switch (current.type) {
          case 'BlockStatement':
            queue.push(...(current.body ?? []));
            break;
          case 'IfStatement':
            queue.push(current.consequent, current.alternate);
            break;
          case 'SwitchStatement':
            queue.push(...(current.cases ?? []));
            break;
          case 'SwitchCase':
            queue.push(...(current.consequent ?? []));
            break;
          case 'TryStatement':
            queue.push(current.block, current.handler?.body ?? null, current.finalizer);
            break;
          case 'WhileStatement':
          case 'DoWhileStatement':
          case 'ForStatement':
          case 'ForInStatement':
          case 'ForOfStatement':
            queue.push(current.body);
            break;
          case 'WithStatement':
            queue.push(current.body);
            break;
        }
      }

      return hasReturn;
    }

    function checkFunction(
      node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
    ) {
      // Skip if function already has return type annotation
      if (node.returnType) return;

      // Skip constructors
      if (node.parent && node.parent.type === AST_NODE_TYPES.MethodDefinition && node.parent.kind === 'constructor') {
        return;
      }

      // Check if function has return statement
      if (hasReturnStatement(node)) {
        context.report({
          node,
          messageId: 'missingReturnType',
        });
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      // ArrowFunctionExpression: checkFunction,
    };
  },
});
