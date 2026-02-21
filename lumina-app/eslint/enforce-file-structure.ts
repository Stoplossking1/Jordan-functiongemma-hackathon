import { ESLintUtils } from '@typescript-eslint/utils';

export default ESLintUtils.RuleCreator.withoutDocs({
  //name: 'enforce-file-structure',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce file structure conventions',
    },
    messages: {
      funcFile: 'Func files should use .ts extension, not .tsx',
      styleFile: 'Styles files should use .ts extension, not .tsx',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(node) {
        const filename = context.filename;

        // Check if *Func files are .ts not .tsx
        if (filename.endsWith('Func.tsx')) {
          context.report({
            node,
            messageId: 'funcFile',
          });
        }

        // Check if *Styles files are .ts not .tsx
        if (filename.endsWith('Styles.tsx')) {
          context.report({
            node,
            messageId: 'styleFile',
          });
        }
      },
    };
  },
});
