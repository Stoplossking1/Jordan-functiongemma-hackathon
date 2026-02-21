import prettier from 'prettier';

const PRETTIER_CONFIG_FILE_NAME = '.prettierrc';

let configOptions: prettier.Options | undefined = undefined;

/**
 * Checks if a file should be formatted with Prettier based on the availability of a parser for that file type.
 * @param filePath - The path to the file to check
 * @returns A Promise that resolves to true if the file should be formatted, false otherwise
 */
async function shouldFormatFile(filePath: string): Promise<boolean> {
  // Config is resolved in the called of this function, therefore we skip the check here for efficiency
  const fileInfo = await prettier.getFileInfo(filePath, { resolveConfig: false });

  if (!fileInfo.inferredParser) {
    console.warn(`Skipping prettier formatting due to missing parser for: ${filePath}`);
    return false;
  }

  return true;
}

/**
 * Formats a string using Prettier with resolved configuration options.
 * @param content - The content to format with Prettier
 * @param filePath - Optional file path to help determine parser (defaults to 'name.ts' for typescript)
 * @param customConfig - Optional custom Prettier configuration options to use instead of resolved config
 * @returns A Promise that resolves to the formatted content string
 **/
export async function formatWithPrettier(
  content: string,
  filePath: string,
  configFileDirectory: string,
  customConfig?: prettier.Options,
): Promise<string> {
  if (!customConfig && !configOptions) {
    const configFilePath = `${configFileDirectory}/${PRETTIER_CONFIG_FILE_NAME}`;
    const resolveConfigOptions = configFileDirectory ? { config: configFilePath } : {};
    configOptions = (await prettier.resolveConfig(configFilePath, resolveConfigOptions)) ?? {};
  }
  const prettierConfig = customConfig ?? configOptions;

  // Skip formatting for excluded file types
  if (!(await shouldFormatFile(filePath))) {
    return content;
  }

  return prettier.format(content, { ...prettierConfig, filepath: filePath });
}
