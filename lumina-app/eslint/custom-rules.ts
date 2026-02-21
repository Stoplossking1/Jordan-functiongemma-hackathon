import enforceFileStructureRule from './enforce-file-structure.ts';
import noLogicInComponentFiles from './no-business-logic-in-components.ts';
import explicitReturnTypeWhenReturns from './explicit-return-type-when-returns.ts';
import noUnsafeSupabaseFilters from './no-unsafe-supabase-filters.ts';

// Custom rules
// https://typescript-eslint.io/developers/custom-rules
// https://typescript-eslint.io/blog/asts-and-typescript-eslint/
// https://github.com/typescript-eslint/examples/tree/main

// const createRule = ESLintUtils.RuleCreator((name) => `https://example.com/rule/${name}`);
// const uppercaseFirstDeclarationsRule = createRule({
//   create(context) {
//     return {
//       FunctionDeclaration(node) {
//         if (node.id != null) {
//           if (/^[a-z]/.test(node.id.name)) {
//             context.report({
//               messageId: 'uppercase',
//               node: node.id,
//             });
//           }
//         }
//       },
//     };
//   },
//   name: 'uppercase-first-declarations',
//   meta: {
//     docs: {
//       description: 'Function declaration names should start with an upper-case letter.',
//     },
//     messages: {
//       uppercase: 'Start this name with an upper-case letter.',
//     },
//     type: 'suggestion',
//     schema: [],
//   },
//   defaultOptions: [],
// });

export default {
  rules: {
    // 'uppercase-first-declarations': uppercaseFirstDeclarationsRule,
    'enforce-file-structure': enforceFileStructureRule,
    'no-business-logic-in-components': noLogicInComponentFiles,
    'explicit-return-type-when-returns': explicitReturnTypeWhenReturns,
    'no-unsafe-supabase-filters': noUnsafeSupabaseFilters,
  },
};
