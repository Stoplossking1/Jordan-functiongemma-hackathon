import * as fs from 'fs';
import * as Yaml from 'yaml';
import { JSON_EXTENSION, TEMPLATE_EXTENSION, YAML_EXTENSION, YML_EXTENSION } from './file-handlers-constants.ts';

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export async function fileExists(targetPath: string): Promise<boolean> {
  try {
    // const stats = await fs.promises.lstat(targetPath);
    await fs.promises.access(targetPath);
  } catch (_e: unknown) {
    return false;
  }
  return true;
}

// Treat all json derivates and json
export function normalizeExtensionCase(extension: string): string {
  const extensionLower = extension.toLowerCase();
  return extensionLower;
}

export function normalizeExtensionName(extension: string): string {
  const extensionLower = normalizeExtensionCase(extension);
  if (extensionLower === YAML_EXTENSION || extensionLower === YML_EXTENSION) {
    return JSON_EXTENSION;
  }
  return extensionLower;
}

export function normalizeTemplateFileName(templateFileName: string): string | undefined {
  const isTmplFile = templateFileName.toLowerCase().endsWith(TEMPLATE_EXTENSION);
  if (isTmplFile) {
    return templateFileName.slice(0, templateFileName.length - TEMPLATE_EXTENSION.length);
  }
}

export function extractFileNameExtension(filename: string): [string, string] {
  // Get base name and extension of the target file
  const lastDotIndex = filename.lastIndexOf('.');
  // do > 0 here so we handle . (e.g .env) files and keep the dot as part of the filename then
  const baseName = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.slice(lastDotIndex) : '';
  return [baseName, extension];
}

export function extractNormalizedFileNameExtension(filename: string): string | undefined {
  // Get base name and extension of the target file
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? normalizeExtensionCase(filename.slice(lastDotIndex)) : undefined;
}

export function isYamlExtension(fileExtension?: string): boolean {
  return fileExtension === YAML_EXTENSION || fileExtension === YML_EXTENSION;
}

export function isYamlFilename(fileName: string): boolean {
  return fileName.endsWith(YAML_EXTENSION) || fileName.endsWith(YML_EXTENSION);
}

export function parse<T>(content: string, useYaml: boolean): Partial<T> | undefined {
  return useYaml ? parseYaml(content) : parseJson(content);
}

export function stringify<T>(content: T, useYaml: boolean): string {
  return useYaml ? stringifyYaml(content, true) : stringifyJson(content);
}

export async function readYaml<T>(filePath: string): Promise<Partial<T> | undefined> {
  let content: string | undefined;
  try {
    content = await fs.promises.readFile(filePath, 'utf8');
  } catch (_e) {
    // if not found, just ignore
    //console.error(e);
  }
  return content ? parseYaml(content) : undefined;
}

export function parseYaml<T>(content: string): Partial<T> | undefined {
  return Yaml.parse(content) as Partial<T>;
}

export async function readJson<T>(filePath: string): Promise<Partial<T> | undefined> {
  let content: string | undefined;
  try {
    content = await fs.promises.readFile(filePath, 'utf8');
  } catch (_e) {
    // if not found, just ignore
    //console.error(e);
  }
  return content ? parseJson(content) : undefined;
}

export function parseJson<T>(content: string): Partial<T> | undefined {
  return JSON.parse(content) satisfies Partial<T>;
}

export async function readDataFile<T = any>(
  filePathNoSuffix: string,
  useYaml: boolean,
): Promise<Partial<T> | undefined> {
  return useYaml
    ? ((await readYaml(`${filePathNoSuffix}${YAML_EXTENSION}`)) ??
        (await readJson(`${filePathNoSuffix}${JSON_EXTENSION}`)))
    : ((await readJson(`${filePathNoSuffix}${JSON_EXTENSION}`)) ??
        (await readYaml(`${filePathNoSuffix}${YAML_EXTENSION}`)));
}

export function writeYaml<T>(filePath: string, content: T): Promise<void> {
  const yamlString = stringifyYaml(content);
  return fs.promises.writeFile(filePath, yamlString, 'utf8');
}

export function stringifyYaml<T>(content: T, forLlm = false): string {
  const yamlString = Yaml.stringify(
    content,
    forLlm
      ? {
          indent: 2,
          lineWidth: -1, // Prevent wrapping
        }
      : undefined,
  );
  return yamlString;
}

export function writeJson<T>(filePath: string, content: T): Promise<void> {
  const jsonString = stringifyJson(content);
  return fs.promises.writeFile(filePath, jsonString, 'utf8');
}

export function stringifyJson<T>(content: T): string {
  // pretty print the output with indentation
  const jsonString = JSON.stringify(content, undefined, 2);
  return jsonString;
}

export function writeDataFile<T>(filePathNoSuffix: string, useYaml: boolean, content: T): Promise<void> {
  return useYaml
    ? writeYaml(`${filePathNoSuffix}${YAML_EXTENSION}`, content)
    : writeJson(`${filePathNoSuffix}${JSON_EXTENSION}`, content);
}

// export async function readStringifiedFile(filePathNoSuffix: string, useYaml: boolean): Promise<string | undefined> {
//   try {
//     const filePath = `${filePathNoSuffix}${useYaml ? YAML_EXTENSION : JSON_EXTENSION}`;
//     return await fs.promises.readFile(filePath, 'utf8');
//   } catch (_e) {
//     // if not found, just ignore
//     //console.error(e);
//     return undefined;
//   }
// }

export function writeStringifiedFile(filePathNoSuffix: string, useYaml: boolean, content: string): Promise<void> {
  return fs.promises.writeFile(`${filePathNoSuffix}${useYaml ? YAML_EXTENSION : JSON_EXTENSION}`, content, 'utf8');
}
