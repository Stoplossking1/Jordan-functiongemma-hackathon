import { Feather } from '@expo/vector-icons';

import { i18n } from '@/i18n';
import type { AllActionKeys } from '@shared/schema-types';

export interface NavigationActionFuncProps {
  actionType: AllActionKeys;
}

export interface NavigationActionFunc {
  actionTitle: string;
  iconName: keyof typeof Feather.glyphMap;
}

// A set of default icons for each action type
const NAVIGATION_ACTION_ICONS: Record<AllActionKeys, keyof typeof Feather.glyphMap> = {
  navigate: 'arrow-up-right',
  back: 'corner-up-left',
  dismissAll: 'x',
  dismissTo: 'corner-down-left',
  dismiss: 'chevron-down',
  push: 'plus',
  replace: 'refresh-cw',
  description: 'info',
};

const NAVIGATION_ACTION_TITLES: Record<AllActionKeys, string> = {
  navigate: i18n.t('navigation.navigate'),
  back: i18n.t('navigation.back'),
  dismissAll: i18n.t('navigation.dismissAll'),
  dismissTo: i18n.t('navigation.dismissTo'),
  dismiss: i18n.t('navigation.dismiss'),
  push: i18n.t('navigation.push'),
  replace: i18n.t('navigation.replace'),
  description: i18n.t('navigation.description'),
};

export function useNavigationAction(props: NavigationActionFuncProps): NavigationActionFunc {
  const actionTitle = NAVIGATION_ACTION_TITLES[props.actionType];
  const iconName = NAVIGATION_ACTION_ICONS[props.actionType];

  return {
    actionTitle,
    iconName,
  };
}
