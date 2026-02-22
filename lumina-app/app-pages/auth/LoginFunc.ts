/**
 * Login business logic for Lumina
 * All regular log-in business logic happens in `LoginCore`, no need to add it here.
 * In rare cases this customization hook can be used to extend it.
 */
import { LoginProps } from '@/app/auth/login';

export interface LoginFunc {}

export function useLogin(props: LoginProps): LoginFunc {
  return {};
}
