import { t } from '@/i18n';

// @deprecated: use the i18n functionality directly to read the app name. Remove in v0.20.0
export function getAppName(): string {
  return t('app.name');
}
