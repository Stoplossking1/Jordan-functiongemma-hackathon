/**
 * Business logic for the Index route - Welcome landing page
 */
import { Feather } from '@expo/vector-icons';

import { t } from '@/i18n';
import { IndexProps } from '@/app/index';

export interface ValueProposition {
  id: string;
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

/**
 * Interface for the return value of the useIndex hook
 */
export interface IndexFunc {
  /**
   * App name from translations
   */
  appName: string;

  /**
   * Main tagline for the landing page
   */
  tagline: string;

  /**
   * Subtitle/description text
   */
  subtitle: string;

  /**
   * Value proposition items to display
   */
  valuePropositions: ValueProposition[];
}

/**
 * Custom hook that provides business logic for the Index component
 */
export function useIndex(props: IndexProps): IndexFunc {
  const appName = t('app.name');

  const tagline = t('index.tagline');

  const subtitle = t('index.subtitle');

  const valuePropositions: ValueProposition[] = [
    {
      id: 'offline',
      iconName: 'wifi-off',
      title: t('index.valuePropositions.offline.title'),
      description: t('index.valuePropositions.offline.description'),
    },
    {
      id: 'memory',
      iconName: 'heart',
      title: t('index.valuePropositions.memory.title'),
      description: t('index.valuePropositions.memory.description'),
    },
    {
      id: 'friendly',
      iconName: 'smile',
      title: t('index.valuePropositions.friendly.title'),
      description: t('index.valuePropositions.friendly.description'),
    },
  ];

  return {
    appName,
    tagline,
    subtitle,
    valuePropositions,
  };
}
