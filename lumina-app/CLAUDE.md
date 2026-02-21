# AGENTS.md

# Directory layout and file use

api/: Interfacing with Supabase edge functions and other data sources needed by the React Native / Expo frontend app.
- supabase-client.ts: Exports the configured `supabaseClient` to be used by the front-end for any Supabase call. 
- {data_category}-api.ts: API functionality exclusive to the frontend and not used by the backend (such as interacting with data from Expo APIs).
  * Examples to put into here are Supabase edge function calls IF they are not also used by the backend.
  * Code that can be shared with the backend instead (this includes ALL Supabase `rpc` calls) MUST be put into "supabase/functions/_shared-client/{data_category}-db.ts" (see below). 
  * Some of the "{data_category}-api.ts" files are "library" code you cannot change. 
  * IF you need to make extensions THEN edit the writable files OR create new "{data_category}-api.ts" file using a proper new app specific {data_category}. IF you want to extend the existing category THEN name it "{data_category}-app-api.ts".
  * The {data_category} of these files need to match the {data_category} of {data_category}-db.ts and the SQL schema files (see below).

app/: Contains all expo route files, such as "{route-name}.tsx". They use "kebab-case" as required by Expo. These files are write-protected and auto-generated to establish the navigation. Edit the files in "app-pages" instead.

app-pages/: Mirrors the directory structure of the "app" directory. It contains files associated with a route in the app directory. Custom components are not allowed in this directory, use "comp-app" below for them.
- {RouteName}Container.tsx: React native component that contains all content for "{route-name}.tsx". Uses same name but in CamelCase. Only contains the layout without styling or business logic - these are integrated via hooks.
- {RouteName}Func.ts: Business logic for "{RouteName}Container.tsx", exposed as a hook.
- {RouteName}Styles.ts: Styling for "{RouteName}Container.tsx", exposed as a hook. You MUST NOT place any business logic here. Also, you MUST NOT define any custom components here, instead create them in "comp-app" or inside the main function of "{RouteName}Container.tsx".

comp-app/: Application specific components with styling and business logic. Use this directory when you need to create new custom components.
- {Component}.tsx: Ract native custom component without styling or business logic - these are integrated via hooks.
- {Component}Func.ts: Business logic for "{Component}.tsx", exposed as a hook.
- {Component}Styles.ts: Styling for "{Component}.tsx", exposed as a hook.

comp-app/styles/: Use this directory to customize colors.
- DefaultColors.ts: The colors to be used across the whole app, using variations of the app's color palette. You may only change the colors and the shades, but not add new colors or use direct color values. If you need to add new colors use "CustomColors.ts".
- CustomColors.ts: Additional colors that are used across the app. You may only add colors that are not available in "DefaultColors.ts".

comp-lib/: A library of components with styling and business logic. Uses same structure as "comp-app". Treat all files inside this directory as read-only.

comp-lib/styles/: Contains all visual styling defaults for this app.
- Styles.ts: Defaults for styling, spacing, fonts. 
- ColorPalette.ts: The color palette that defines all base colors.
- TypographyBasePresets.ts: Text presets regarding fonts and size.
- TypographyPresetStyles.ts: Text style presets based on the default fonts, colors and styles.

supabase/functions/_shared/: Contains all code that is shared across supabase edge functions.

supabase/functions/_shared-client/: Contains all code that is shared between supabase edge functions and React Native/Expo frontend apps. When referencing any of this code from the "app", "app-pages", "comp-app" and "comp-lib" directories, use the import prefix "@shared/" instead of "./supabase/functions/_shared-client/".
- generated-db-types.ts: Exposes all API types, enums and function definitions from Postgres schema files in "supabase/schemas/*/{number}_{data_category}/{number}_{category}-api-*.sql" as Typescript code. It's the interface to the database and it's generated from the SQL files.
- {data_category}-db.ts: Exposes Supabase `rpc` function calls and shared utility and API code for edge functions. 
  * Each file represents one "category" of data in the database. The {data_category} in the filename needs to match the the one used in the SQL schema directory "supabase/schemas/*/{number}_{data_category}/".
  * Some of these files are "library" code you cannot change. Only extend files if they are in the list of editable files.
  * If you need to make extensions THEN edit the writable files OR create new "{data_category}-db.ts" file using a proper new app specific {data_category}. IF you want to extend the existing category THEN name it "{data_category}-app-db.ts".
  * The {data_category} of these files need to match the {data_category} of the SQL schema files.

supabase/schemas/: Postgres SQL schema files. 
- All directory and file names have a number prefix to ensure execution order when adding the sql to the database. 
- The files in sub-directories are NOT migration files, i.e. they define the desired state of the database and NOT incremental changes. Hence they should not contain `DROP` or `ALTER` statements. 

supabase/schemas/0_lib/: Contains all "library" schema file definitions, one {data_category} per sub-directory. It's readonly, app specific extensions go into "1_app" below.
- Each sub-directory represents a "{data_category}" in the database, which is not just one table but a couple of related tables and concepts.
- {number}_{data_category}/: Every file in this directory is optional and should only be there if needed. The "{category}" name is a short version of the "{data_category}".
  * 0_{category}-init.sql: SQL statements that need to run upfront and don't fit the purpose of the other files below. Not needed usually.
  * 1_{category}-types.sql: SQL enums, domains, and composite types used DIRECTLY in table creation statements. Otherwise, put them in "5_{category}-api-types.sql" below. Define them in the "public" schema, so they can also be used in the APIs below.
  * 3_{category}-tables: SQL tables, indexes and sequence definitions. Represents all the "stateful" part that stores actual data. MUST be defined in the "private" schema.
  * 4_{category}-funcs.sql: Private SQL functions needed ONLY internally for tables to work, e.g. for triggers and constraints. MUST be defined in the "private" schema.
  * 5_{category}-api-types.sql: SQL composite types used for interfacing with the front-end. MUST be defined in the "public" schema. 
  * 7_{category}-api-funcs.sql: SQL functions used for interfacing with the front-end through Supabase `rpc` calls. MUST be defined in the "public" schema unless it's a utility function.
  * 8_{category}-buckets.sql: Defines Supabase storage buckets and their permissions using RLS.
- Extensions to tables, functions, types etc. in these readonly files need to be done through composition in writeable files, e.g. use extension tables with foreign keys, new functions that call others or new composite types that embed existing types. 

supabase/schemas/1_app/: same structure as in "0_lib" but for app specific schemas.
- Newly created directories must have a number prefix that ensures the proper order of execution.
- IF an existing {data_category} from "0_lib" needs to be extended with functionality and types THEN
  * Make a directory with the same name but use a number prefix that matches the execution order needed relative to other app schemas in this directory.
  * MUST not modify an existing table in "3_{category}-tables". Instead, create new tables that have a foreign key relationship to the existing one.

supabase/seed/: Postgres SQL seed content files.
supabase/seed/0_lib/: Contains "library" seed files. It's readonly, app specific extension go into "1_app" below.
- Content is stored per "{data_category}" either in a single {number}_{data_category}.sql or in {number}_{data_category}/*.sql files.
- NOTE: Supabase seed files are run by level, i.e. first all {number}_{data_category}.sql are run before the {number}_{data_category}/*.sql files are run.

supabase/seed/1_app/: same structure as in "0_lib" but for app specific seed files.
- Ensure that newly created files or directories have a number prefix that ensures the proper order of execution.
- IF an existing {data_category} from "0_lib" needs to be extended with additional seed content THEN
  * Make a file or directory with the same name but use a number prefix that matches the execution order needed relative to other app seed content in this directory.

# General code guidelines

- Stay consistent with the code-base. Don't invent new ways of doing things.

## Avoid redundancies

- MUST use constants for anything that's not simple numbers like 0 or 1.
- MUST avoid duplicating functionality or data.
- IF a function or data structure you want to add is _similar_ to an existing one THEN refactor the existing one to also cover the new requirements.

# Typescript coding rules

## Typescript Typing

- Add types to all function parameters
- Always add return types. Avoid
  `function f() {return 'hi'};` 
  instead do
  `function f(): string {return 'hi'}`
- Avoid the use of `any` whenever possible. If you find yourself casting through `any` to yet another type (i.e. `value as any as <type>`), reconsider your approach. Is there a way to avoid this? If a cast is required, try to use `satisfies` instead. We want typesafety as this allows us to use the compiler to help with finding issues instead of running into run-time exceptions later.

## Undefined/Null handling

- Use `undefined` instead of `null`. Only exception is cases where 3rd party code requires the use of `null`. In that case, use casts like `value ?? null` to convert from `undefined` to `null` at the interface boundary and `value ?? undefined` for the interface return. 
- Avoid supporting both `null` and `undefined` in the same parameter to avoid confusion (this includes optional parameters such as `value?: <type> | null`). There might be rare cases where this is needed but generally try to avoid it.
- Use optional parameters through `name?: <type>` instead of `name: <type> | undefined`
- Use nullish coalescing operator `??` instead of logical "or" operator `||` when handling `null` or `undefined` values. `||` will also act on empty strings `""`or values that are `0` and it's most likely not what you had intended.
- Use `== null` instead of checking for `=== null` or `=== undefined`. It will cover both cases.
- Be carefull when using checks like `if (value)`. This not only covers `null` and `undefined` but also `0` and empty strings `""`. If in doubt, please be specific and use `if (value != null)`.

## Constants

- Use constants where possible to make code maintainable - keep it DRY - don't repeat yourself
- Add translation strings to all user facing texts

## Naming

- Use names that are self explantory and specific. If you feel the need to leave a comment to explain the meaning of a variable, consider changing the name to something more specific.
- Use Typescript style naming and avoid "python" style naming, e.g. variables are `camelCase` and not `snake_case`.
- If a variable encodes a unit, always add the unit to the name. E.g. `weightInKg` vs. `weight` or `timeInMs` instead of `time` makes it clear what is meant and if content needs to be converted. 
- In timestamp strings use the `...At` suffix to be aligned with sql naming, e.g. `createdAt`.
- When using abbreviations and acronyms in names, only make the first letter uppercase, i.e. `userUuid` or `weightInKg`
- When storing paths in variables, always use the "Path" suffix and use these additional rules to help decide when to call `path.resolve`, `path.relative` or simply `path.join` to construct and translates between paths:  
  * {filePath}: path that maybe relative to current working directory or potentially absolute
  * {filePath}Rel: a path relative to the root directory, i.e. is purely inside of it and will not start with a ".", ".." or "/"
  * {filePath}Abs: a path guaranteed to be absolute, i.e. starts with a "/"

This really helps to decide when to call `path.resolve`, `path.relative` or simply `path.join` to construct and translate between them.

## Regular functions vs. arrow functions

- Use regular functions (`function x() {}`) instead of arrow functions (`const x = () => {}`) wherever possible so we get proper call-stacks while debugging. 
- Use `for (const item of array) {}` instead of `array.forEach((item) => {})` to avoid an anonymous arrow function on the call stack.
- Avoid making extra arrow functions in hooks that just call a function with the exact same number of parameters. Just pass the function as value then. Instead of `const prop = (x) => { myFunc(x)}` just do `const prop = myFunc` (without the brackets). The only exception is for functions that are class members and require the `this` pointer to be preserved.
- In hooks, avoid destructuring the function parameters such as `function useHook({value1: string, value2: string}: Props)`. Instead, use `function useHook(props: Props)` and then `props.value1` where it's needed.

## Import and Export statements

- Place 3rd party library `import` statement on top of local imports and seperate both with an empty line.
- Avoid wild-card re-exporting imports
- When importing shared code from the app frontend use the import prefix "@shared/" instead of "./supabase/functions/_shared-client/"
- DO NOT import any other code from "supabase" inside front-end code to avoid leaking backend-code into the apps.
- Avoid using dynamic `await import()` statement when a regular import works as well
- Avoid `export default` except for functions that define React Native components.

## General React Native rules

- When triggering functions in hooks from components, these hook functions need to be synchronous, hence not a Promise returning async function. Name them "onXXX" and return `void` to indicate their purpose, e.g. `<CustomButton onPress={onHandleResetPassword}/>`. The reason for this is that there's no good way of handling asynchronous responses in components. The "onXXX" itself then can call async functions but needs to handle errors through
  ```
  function onHandleResetPassword() {
    handleResetPasswordAsync().catch((error) => {
      console.error('onHandleResetPassword error:', error);
    });
  }
  ```
- Add return types to all custom React components, use `ReactNode` instead of `JSX.Element` as the return type
- MUST NOT call functions on expo router directly (e.g. `router.push()`) or use `window.location` to trigger navigation actions. All interaction needs to happen through the `useNav` specific navigation action properties defined in "{route-name}.tsx". If there are none, then this page doesn't support navigation actions.

## React Native Component rules

- Ensure layout follows best practices for mobile app design and UX.
- Pay attention to mobile layout principles such as vertical rhythm, visual hierarchy, and concise text.
- MUST NOT add styling (e.g., inline JSX or others) or function definitions in React Component. These belong in their own files.
- MUST NOT use inline functions in JSX, except when simply passing arguments to an existing handler (e.g., `onPress={() => handler(value)}`). All other handlers must be defined in "{RouteName}Func.ts".
- MUST NOT define inline options (e.g., for radio lists, selects, or checkboxes) in JSX. Instead, define them in "{RouteName}Func.ts" with properly typed values instead of generic `string`.
- MUST NOT define style types with `any`. Instead, MUST define them in "{RouteName}Styles.ts" and import them to "{RouteName}Container.tsx".

### Use of existing components

- Use custom React components from "comp-lib" and "comp-app" whenever possible instead of using 3rd party components or making new ones.
- MUST use `CustomTextField` or `CustomTextInput` for all text elements instead of `<Text>` or `<TextInput>`. If you can't use CustomTextField for certain cases (e.g., text nesting), you may use `<Text>` only with `allowFontScaling={false}`.
- Reuse code!
- IF new React Native components needed AND the component logic is more than a few lines OR reused across multiple pages THEN
  * Put into "comp-app" directory, using the proper file naming patterns.
  * Make one file for the component, business logic hook and styling hook and define them in new "{Component}.tsx", "{Component}Func.ts", "{Component}Styles.ts" files.
  ELSE IF the component logic only requires a few lines AND is only used within that page THEN
  * Define it outside the main component in "{RouteName}Container.tsx".
  * It MUST define its own explicitly typed SubComponentStyles interface in "{RouteName}Styles.ts", import it into "{RouteName}Container.tsx", and pass it via props from the main component (never `any`).
  Example:
  ```
  import { type SubComponentStyles } from ""{RouteName}Styles.ts"";
  interface SubComponentProps { styles: SubComponentStyles; ... }
  function SubComponent(props: SubComponentProps): ReactNode { return <View style={styles.container}>...</View>; }
  function MainComponent(): ReactNode { const { styles, subComponentStyles } = useMainComponentStyles(); return (<View style={styles.container}><SubComponent styles={subComponentStyles} /></View>); }
  ```
- IF using `CustomButton` component THEN MUST NOT add children to it (it cannot wrap other elements).
- Button title and placeholders MUST be very short and concise, e.g., use just "skip" instead of "Skip for now".
- Use checkboxes instead of buttons UNLESS text is very small and fits into button container.
- Profile photo upload supports only one image. Do not include multiple uploads or previews.

### Navigation & context

- Include clear primary and secondary actions (e.g. "Continue" and "Back").
- Show the user's location in multi-step flows (e.g., "Step 2 of 4" or progress bar).
- Provide escape navigation actions/buttons (cancel, back, close) where appropriate.
- IF showing lists and feeds THEN make entire list item tappable to navigate to detail page AND MUST NOT add extra navigation buttons on list items.
- IF page is a detail page (e.g. of a feed showing individual feed item details) THEN add "back button" to trigger navigation action (if available).
- IF page already has a navigation header with back button (e.g. in Onboarding component) THEN MUST NOT add back button at page bottom.
- MUST NOT use two titles per page. IF page has title (e.g. onboarding pages) THEN customize title instead of adding another one.
- MUST NOT hardcode or invent app name anywhere. IF page needs app name THEN MUST get the translated app name using `t('app.name')` from "@/i18n/index.ts".

### User education & assistance

- Include brief explanations for domain-specific terminology.
- Show helper text for complex inputs, ideally as placeholder text where it makes sense.
- Indicate where to find additional information (tooltips, info icons, etc.).

### Text handling & readability

- Ensure all essential information fits within a single, well-structured layout. 
- Balance information density with readability (avoid cramming).
- Use concise text and clear instructions. Elements with larger text need to use a more concise writing style or a smaller font size.
- MUST avoid redundant text. e.g. IF an input has a section title THEN skip the label and instead use placeholder text.
- Eliminate any duplicated or redundant text to maintain clarity and a clean visual hierarchy.
- Set reasonable character limits for single-line elements.
- For longer descriptive text, show 1-2 lines with "Read more" expansion if needed,
- Implement responsive text wrapping to prevent content from extending beyond the screen width.
- Design flexible layouts that accommodate varying text lengths.
- Use multi-line layouts for list items that contain descriptive text.
- Left-align text if possible.
- Consider how text will appear when translated to languages with longer word lengths.
- IF translation for text is present in "i18n/locales/en.lib.json" THEN integrate it using `t` from "@/i18n/index.ts" ELSE put text directly. MUST NOT attempt to add new entries to "i18n/locales/en.lib.json", this file is readonly. Instead, add new english entries to "i18n/locales/en.app.json", even if the application is using a different language.
- IF showing a form THEN include all relevant fields with proper input types and validation state.
- IF data is invalid or missing THEN use defaults, placeholders, or hide the content.
- All displayed values must be properly sanitized. MUST NOT show `NaN`, `undefined`, `null`, or broken formatting to the user. 
- Custom display logic is allowed, but must ensure the output is always readable and safe. 
- Do not use HTML entities or escape characters. Use straight quotes and apostrophes instead of encoded symbols like `&#39;` or `&amp;`. 
- Wrap any string containing characters that could cause JSX syntax errors (e.g., apostrophes, quotes, angle brackets) in `{""}` to avoid React Native lint errors.
  Example: `<CustomTextField title={"Don’t worry"} ... />`

### Image and icon handling

- Add text only when necessary, use icon-only elements for commonly recognized actions or symbols without adding extra labels.
- Always wrap icons in a `<View>` with explicit `width` and `height` to ensure proper layout and prevent overflow.

### Animation

- IF the element has animation THEN add `Animated` to it (e.g., `<Animated.View>`).

### Layout adaptability

- Structure all UI elements within a clear and consistent layout optimized for mobile apps.
- For items with similar structure, maintain consistent height handling (all single line or all multi-line).
- Use appropriate containers that can expand vertically rather than fixed-height elements.
- Use scroll views where content can overflow the screen vertically.
- Allow critical information to wrap rather than truncate.

## React Native Component Business Logic rules

- "{RouteName}Func.ts" is purely for business logic and may not define new custom components.
- MUST NOT use browser-only globals (e.g., `window.location`, `localStorage`) or "browser navigation APIs".
- IF access to browser globals cannot be avoided THEN guard access with `isPlatformWeb` from `useResponsiveDesign`.
- IF using mobile-only APIs (e.g., *Vibration*) THEN guard access with `isPlatformNative` (to avoid runtime crashes).
- MUST NOT use react-native `Alert.alert`. If an alert is needed, use `alert` from "@/utils/alert.ts" with the same function signature.
- MUST NOT put JSX statements into "{RouteName}Func.ts" (as it causes compile errors). Instead put these into separate "{Component}.tsx" files.
- IF "{RouteName}Func.ts" needs to dynamically inject a component into "{RouteName}Container.tsx" THEN instantiate component in "{RouteName}Func.ts" by importing it and then exposing it as a hook parameter back to "{RouteName}Container.tsx".
- Avoid runtime errors by coding defensively and checking for `null` or `undefined` values before accessing properties. Use optional chaining (?.) and nullish coalescing (??) operators to safely access nested properties
- Use the navigation hooks in file "{route-name}.tsx" for any navigation purposes.
  * MUST NOT call expo router functions directly. Instead MUST call existing functions of the navigation hooks.
- Pay attention to the existing `Props` interfaces and the data types they use.
- IF data is provided in `Props` THEN 
  * MUST keep the data.
  * MAY enhance data processing if beneficial, e.g. extend validation, add placeholder, helperText etc. 
  * MUST NOT change units and existing validation, like `min` and `max`.

## React Native Styling rules

- Changes to the styling MUST NOT break the existing functionality.
- The styling needs to look beautiful, modern and polished.

### Interaction design

- Clearly indicate interactive vs static elements.
- Show explicit selection states (selected/unselected) for toggles, checkboxes, radio buttons.
- Show loading states where relevant.

### Visual hierarchy & consistency

- Ensure spacing, alignment, and contrast are aligned with best design principles for clarity and aesthetic polish. 
- Maintain logical heading hierarchy.
- Balance button sizes according to importance and usage frequency.
- Style buttons with clear visual distinction between *primary*, *secondary*, and *tertiary* actions.
- The `CustomButton` component already comes pre-styled and rarely needs customization.
- Apply consistent typography styles (`typographyPresets`) based on element importance.

### Spacing

- Avoid excessive vertical whitespace. Make sure the page feels complete and visually intentional.
- Use consistent spacing by applying the app's `spacingPresets` for all new spacing decisions.
- Check existing component margins/padding before adding new spacing to prevent overlap or duplication.
- Add spacing only where visual gaps exist and existing styles don't already provide adequate separation.
- When adding spacing, ensure a minimum of `spacingPresets.xs` for proper visual separation.
- Define spacing in one place per component relationship - either on the parent container or child elements, not both.
- Keep spacing minimal and consistent, even with scroll.

### Accessibility

- Ensure sufficient contrast ratios (4.5:1 minimum for text).
- Design with color-blind users in mind (don't rely solely on color).

### Responsiveness & context

- Ensure the page fits within a standard mobile viewport without horizontal scrolling. Responsive design and Safe areas are already handled by the framework.
- If you're using a horizontal-only scroll view, make sure that `flexGrow: 0` is set on the the container style so the scroll view does not grow vertically.
- IF header has multiple icon buttons THEN distribute them evenly on left/right sides to keep the title centered, with each side not exceeding `60px` width.
- When layout elements use vertical `flex`, put main content in `flex: 1` to push the button to the bottom. Don't add vertical gaps above the button

### Color & Theming

- Use color purposefully for branding, feedback, and emphasis (not just decoration).
- You MUST NOT use shadows!
- Avoid using the same type of color for elements placed on top of each other, such as using two accent colors (e.g., `primaryAccentLight` + `primaryAccent`) because they may not contrast enough and can blend visually. Instead, use a background color with its matching foreground color (e.g., `primaryAccentLight` as the background, `primaryAccentForeground` for the text) to ensure readability and proper visual contrast.

### Style usage

- IF styling custom or core components THEN MUST use their own styling hooks.
- IF using `CustomButton` OR `CustomTextInput` THEN MUST get preset styles from `useStyleContext`. 
  ELSE IF using other custom or core components THEN MUST use component's styling hook to get default styles AND then override them using `overrideStyles` function.
  Example for `CustomPicker` custom styling: 
  ```
  const customPickerCoreStyles = useCustomPickerCoreStyles();
  const customStyles = overrideStyles(customPickerCoreStyles, {styles: {container: {...},iconStyle: {...}}, pickerStyles: {...}});
  ```
- IF setting any styles of custom or core component THEN MUST use `overrideStyles` for it.
- IF overriding styles THEN
  * Import required types from "comp-lib" into "{RouteName}Styles.ts" components (for better typing and to avoid runtime errors). 
  * MUST NOT use the `any` type.
  * MUST NOT force-cast style objects with `as` (e.g. `{} as SomeStyles`), instead use the actual style preset or hook (e.g. `buttonPresets.Secondary`, `useCustomHeaderStyles()`, etc.).
- IF overriding `*BaseStyles` of custom component THEN extract it from style hook. Example:
  ```
  const defaultHeaderStyles = useCustomHeaderStyles();
  const customHeaderBaseStyles = overrideStyles(defaultHeaderStyles, {container: {...}, title: {...}});
  ```
- IF overriding `fontSize` THEN also set `lineHeight` with _fixed number_ >= new `fontSize` AND NOT using expression like `fontSize * 1.2`.
- Avoid setting `flex:1` on a container that doesn't need to expand to fill available space. 
- Only use `flex:1` when a component needs to grow and take up remaining space. Avoid using it on a `CustomButton` component.
- IF actions are critical (e.g. delete or cancel actions) THEN style them as a warning.
  ELSE style other actions (e.g. "Sign Out" button) in neutral color like for a secondary button.
- IF using icons/avatars, fixed-dimension cards, media with aspect ratios, navigation elements, or pixel-perfect design requirements THEN set explicit width.
  ELSE let elements naturally expand to full container width and avoid fixed width values unless absolutely necessary: use `flex: 1` for equal distribution, `width: '100%'` for full width, `minWidth`/`maxWidth` for controlled flexibility.
- IF dimension calculations require screen width/height THEN read them from `useResponsiveDesign`.
- IF implementing layouts with multiple columns THEN use dimensions from `useResponsiveDesign`.

## Application content rules

- The page should feel visually full, complete, and professionally crafted.
- Avoid overloading the page with unnecessary content or lengthy informational paragraphs. 
- No placeholders, "lorem ipsum" text, or incomplete sections
- IF adding new components OR functionality and no existing content available THEN use dummy content.
- IF example photos OR images needed (not icons, logos, badges) THEN
  use images from unsplash.com.
  IF no suitable images found use placeholder at "assets/images/placeholder.svg".
- IF icons, logos, or badges needed THEN use "expo icons" library whenever it makes sense.

## Application APIs rules

- IF new frontend specific data APIs needed THEN
  * Extend matching editable file in "api" OR create new file for the specific "{data_category}".
  * IF API is using Supabase SQL data or edge functions THEN "{data_category}" name needs to match the category of the SQL schema or edge function.
  * Avoid a re-export of functionality in "{data_category}-db.ts"

## Database APIs rules

- Communication with the database (from the Frontend or Edge Functions) MUST exclusively happen through "{data_category}-db.ts" files, using the Supabase client calling SQL functions with `rpc()` as shown in the existing API functions.
- IF need to add/modify APIs THEN 
  * extend APIs in the editible "{data_category}-db.ts" files in "supabase/functions/_shared-client" or create new ones. The category name needs to match the category of the SQL schema filename.
  * You MUST preserve the core functionality of these files. You can add new functions or extend existing ones.
  * IF SQL functions prefixed with `admin` are called MUST prefix Typescript function name with `admin` and name the function parameter for the client `supabaseAdminClient`.
- Avoid "client side" joins by writing or extending SQL functions that join data on the server in sophisticated ways and return all of it in one call.

## Security

- Access to the Supabase `service_role` can only happen in Supabase edge functions.
- A Supabase client that is initialized with a `serviceRoleKey` MUST be named `supabaseAdminClient` instead of the regular `supabaseClient`.
- Functions that use a `supabaseAdminClient` need to be prefixed with `admin` and also name their function parameter `supabaseAdminClient`. 
- If you ever call an `admin` prefixed function with a regular `supabaseClient` or a function without `admin` prefix using a `supabaseAdminClient`, then this is a clear indication that there's a problem.

# SQL coding conventions

## Naming

### Tables

- Define in "private" schema and use snake_case.
- Use singular for the name, e.g. `private.user` instead of `private.users`
- IF column encodes a unit THEN MUST add the unit to the name. E.g. `weight_in_kg` vs. `weight` or `time_in_ms` instead of `time`. 
- Timestamp columns need to use the `..._at` suffix, e.g. `created_at`.

### Indexes

- Use naming pattern `{table_name}_idx_{column_name}`

### Functions

- Local variables in SQL functions use snake_case with underscore prefix, e.g. `_my_variable`

### API naming

- Functionality that is exposed as API to the client needs to be defined in the "public" schema and use quoted "PascalCase" and "camelCase".

- Composite Types: 
  * MUST be defined in the "public" schema
  * Use quoted "PascalCase" for their name + "V1" suffix. If they represent a table, translate table name to PascalCase, e.g. table `user_profile` becomes `UserProfileV1`.
  * Field names use a quoted "camelCase" version of the table columns they represent.

- API SQL functions:
  * MUST be defined in the "public" schema.
  * Use quoted "PascalCase" for their name. 
  * Parameters and return values use quoted "camelCase". 
  * Must use the naming pattern `app:{data_category}:{topic}:{subtopic}:{action}` or `admin:{data_category}:{topic}:{subtopic}:{action}`.
  * Functions with `app:` prefix are supposed to be called from the client apps and `admin:` functions only from edge functions. 
  * `{topic}` and `{subtopic}` group related functionality. They may be omitted.
  * `{action}` follows the "CRUD" model and can be e.g. `read`, `readAll`, `update`. If needed use more specific versions such as `readWithUser`.

## Security

- Follow the security by default principle, i.e. the system is locked down and we only provide access to it through specific functionality.
- DO NOT use RLS for tables, instead use case-by-case checks inside API functions
- Use RLS for buckets. 
- All tables, indexes, sequences need to be defined in the "private" schema
- Functionality that is not exposed as API to the client needs to be defined in the "private" schema. I.e. other then the API functions and types there should be nothing defined in the "public" schema.
- Access to the "private" schema may only happen through SQL functions.
- NEVER grant direct access permissions for anything in the "private" schema to roles `anon` or `authenticated`.
- Every function MUST remove search path through `SET search_path = ''`

### API Functions

- API function names MUST use the `app:` or `admin:` prefix 
- Functions with `admin:` prefix
  * MUST NOT use `SECURITY DEFINER`
  * Set permissions to `GRANT EXECUTE ON FUNCTION public."admin:{name}" TO service_role;`
- Functions with `app:` prefix
  * MUST USE `SECURITY DEFINER`
  * FOR EACH function DO decide if user needs to be logged in to access it. App start-up functionality MUST be accessible without login.
    + IF login needed 
        + Set permissions to `GRANT EXECUTE ON FUNCTION public."app:{name}" TO authenticated;`
        + MUST check if the current user is allowed access to the data they request. IT's IMPORTANT to get this right. Only return the data they are allowed to see or null otherwise. Use `auth.uid()` to determine the user id.
      ELSE set permissions to `GRANT EXECUTE ON FUNCTION public."app:{name}" TO anon, authenticated;`.

## NULL / NOT NULL handling

- In `COALESCE` statements NEVER use constants for user id or entity id.

## Schema files

- MUST NOT use `ALTER` or `DROP` statements to modify tables or columns. Design the desired final state of the SQL database by updating the statements in the .sql files instead of attempting incremental changes through SQL statements.

## SQL schema file rules

- IF need to modify SQL schema THEN extend schema files "1_app/{number}_{data_category}/*.sql" in "supabase/schemas/" or create new ones following the naming rules.
- IF columns or tables to add belong to existing logical group of data THEN edit the existing files for the "{data_category}"
  ELSE create schema files for new "{data_category}" AND use naming rule "1_app/{number}_{data_category}/*.sql" with sequence number chosen so it will be sorted chronologically after existing files unless for specific cases where it needs to be run before existing ones.
- Reuse SQL enums and custom types when you define new SQL columns. MUST avoid defining "text" or "numeric" columns that store a copy of an enum value.
- MUST NOT store semantically identical data in multiple columns or tables.
  * Before adding new columns MUST confirm that information stored is not already stored in other columns of same or different table.
  * MUST check for column names that have a different name but same semantic meaning. E.g. `givenName` can store a `firstName`, and `familyName` also stores `lastName`.
  * Check different forms of representation, e.g. IF enum has value that is also represented as boolean column THEN these MUST be combined.
- Client API: Use SQL Composite Types and SQL functions to expose or update database tables.
- SQL Composite Types: 
  * Content and field definitions mirror the associated tables.
  * Since SQL Composite Types don't support `NOT NULL` definitions in fields, use existing custom SQL Domain Types in format `{datatype}_notnull`.
  * When returning data from multiple tables create new SQL Composite Types that embed other existing API Composite Types e.g.
    ```
    SELECT ROW(
    ROW(u.*)::"UserV1",
    o.description
    )::"UserWithDescriptionType"
    FROM users u
    JOIN orders o ON u.id = o.user_id;
    ```
- SQL Functions:
  * Functions that create new table entries should use existing API Composite Types to pass all content if possible instead of defining function parameters for each table column.
- MUST NOT use `ALTER` or `DROP` / `CREATE` combinations to change tables, functions or anythings else. These files are NOT meant to be "migration files" for making incremental changes:
  * non-editable schema files in "0_lib": Create a new related table that references existing ones through foreign keys. E.g. in a workout app instead of extending the `private.profile` table, create new `private.workout_profile` table to store application specific profile information.
  * editable schema files in "1_app": MUST directly change the content of tables and the access APIs in these app specific schema files AND MUST NOT use `ALTER` to make the changes.
- MUST NOT use `ALTER` and `DROP statements`: these are a sign that you are not following the rules above.
- Call `CREATE EXTENSION` in SQL before using functions from an extension. You can only use these extensions: "pgvector", "amcheck", "auto_explain", "bloom", "btree_gin", "btree_gist", "citext", "cube", "earthdistance", "fuzzystrmatch", "hstore", "isn", "lo", "ltree", "pg_trgm", "pgtap", "seg", "tablefunc", "tcn", "tsm_system_rows", "tsm_system_time", "uuid-ossp"
  
## SQL seed file rules

- SQL seed content is exclusively stored in "supabase/seed/"
- IF ingesting new content into the database THEN extend the SQL seed files in "supabase/seed/1_app/" or create new ones in that directory.
  * Inspect the existing editable seed files and extend with new content that matches their "{data_category}".
  * IF new content doesn't fit existing categories THEN make new seed file using naming rule "1_app/{number}_{data_category}/*.sql" where number MUST match number of SQL schema file for same "{data_category}".
- IF adding batch content using `INSERT INTO .. VALUES (arguments), (arguments);` THEN ensure all entries have same number of arguments.
  * IF there's an insert error about this THEN double check and fix all entries instead of just first one where error happened.

# Code change process

- MUST ALWAYS run `npm run sshbuilder:git-push-deploy -- '<your commit message>'` after every change. Replace `<your commit message>` with a brief description of the changes (e.g., "Add login button to header"). This command commits and deploys to the live web preview through git and uses the commit message as the version description in the UI.
- IF any SQL schema files in "supabase/schemas/" are modified (which affects database types) THEN MUST run `npm run sshbuilder:gen-db-types` before running `npm run sshbuilder:git-push-deploy -- '<your commit message>'` to regenerate TypeScript types from the SQL schema files.
- IF any translation files in "i18n/locales/" are modified THEN MUST run `npm run sshbuilder:gen-i18n-types` before running `npm run sshbuilder:git-push-deploy -- '<your commit message>'` to regenerate TypeScript types from the translation files.
- After running `npm run sshbuilder:git-push-deploy -- '<your commit message>'`:
  * IF the command succeeds THEN the preview will reload on the Woz App Preview (on web) in 1-2 minutes.
  * IF the command fails THEN it will return compile or linter errors that MUST be fixed, then run `npm run sshbuilder:git-push-deploy -- '<your commit message>'` again.

# Environment Variables

- To add or update environment variables for a project, you MUST NOT MODIFY environment template files directly.
- MUST run `npm run sshbuilder:envVars` to add or update environment variables.
- IF the environment variable value has to be provided by the user, prompt the user to insert it and call `npm run sshbuilder:envVars` with the `--value` parameter.
- The `npm run sshbuilder:envVars` command automatically triggers redeployment based on the `--type` parameter: `BACKEND` env vars trigger backend redeployment, `FRONTEND` env vars trigger frontend redeployment.
- You DO NOT have to call the `npm run sshbuilder:git-push-deploy -- '<your commit message>'` command after running `npm run sshbuilder:envVars` unless you have other code changes to save and deploy.
- After running `npm run sshbuilder:envVars`:
  * IF the command succeeds THEN the preview will reload on the Woz App Preview (on web) in 1-2 minutes.
- To see the full list of paramaters for `npm run sshbuilder:envVars`, you can run it with the `--help` or `-h` flag.
## Command Syntax

```bash
npm run sshbuilder:envVars -- --name=<ENV_VAR_NAME> [--value=<value>] [--description=<description>] [--displayName=<displayName>] [--type=<BACKEND|FRONTEND>]
```

# In-App Purchases (RevenueCat Integration)

- Check the contents of the frontend environment variables for RevenueCat API keys and project ID to verify the RevenueCat integration is set up correctly.
    * IF the API keys are missing you MUST notify the user that the RevenueCat integration is not set up and they need to connect their RevenueCat account via "Connect with RevenueCat" in the Woz Dashboard.
    * ELSE the RevenueCat integration is set up correctly and you can start using the RevenueCat MCP and 'react-native-purchases' and 'react-native-purchases-ui' libraries pointing to the correct project id.
    * IF the project ID is missing and you find more that one project when fetching from RevenueCat THEN you MUST ask the user to tell you which project to use. DO NOT just pick one at random.
- User authentication is automatically synced with RevenueCat when users log in through the <RevenueCatProvider> component in the app.
- **CRITICAL: User Logout** - When implementing user logout functionality, you MUST ALWAYS call `logoutUser()` from the `useRevenueCat()` hook (from `@/comp-lib/integrations/revenue-cat/RevenueCatProviderFunc`) BEFORE signing out from Supabase.
- IF the RevenueCat MCP access token expires, you MUST call the `npm run sshbuilder:refresh-integration-tokens` command to refresh it and tell the user to disable and re-enable the RevenueCat MCP in their agentic environment (Cursor, VSCode, ClaudeCode, etc.)
- IF refreshing the token does not work THEN the user MUST manually generate a new RevenueCat API key and update the frontend environment variables through the "Environment Variables" section in the Woz Dashboard.
