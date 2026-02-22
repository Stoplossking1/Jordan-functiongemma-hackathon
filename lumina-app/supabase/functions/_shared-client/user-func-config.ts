export const USER_EDGE_FUNCTION_PATH = 'user';

export enum UserEdgeActions {
  DELETE_USER = 'deleteUser',
}

export function userEdgeAction(action: UserEdgeActions): string {
  return `${USER_EDGE_FUNCTION_PATH}/${action}`;
}
