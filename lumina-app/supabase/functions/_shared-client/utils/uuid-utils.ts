/**
 * Checks if the project name follows the patter "project-[uuid]", e.g. project-396ac13a-0dd5-4f2d-b932-1a1fa92b083f
 * Used to filter project names that haven't been customized by the user and still use the default generated name format.
 */
export function isDefaultProjectName(projectName: string): boolean {
  const projectUuidRegex = /^project-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return projectUuidRegex.test(projectName);
}
