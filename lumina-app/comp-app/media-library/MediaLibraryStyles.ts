import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { type CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';

const GRID_ITEM_SIZE_PX = 100;
const GRID_GAP_PX = 8;
const FILTER_TAB_HEIGHT_PX = 36;
const CONTENT_MAX_WIDTH_PX = 520;

export interface MediaLibraryBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  filterTabs: ViewStyle;
  filterTab: ViewStyle;
  filterTabActive: ViewStyle;
  filterTabText: TextStyle;
  filterTabTextActive: TextStyle;
  contentContainer: ViewStyle;
  gridContainer: ViewStyle;
  gridItem: ViewStyle;
  gridItemImage: ImageStyle;
  gridItemOverlay: ViewStyle;
  gridItemIcon: ViewStyle;
  gridItemDuration: TextStyle;
  gridItemFavorite: ViewStyle;
  emptyContainer: ViewStyle;
  emptyIcon: ViewStyle;
  emptyText: TextStyle;
  emptyHint: TextStyle;
  loadingContainer: ViewStyle;
  errorText: TextStyle;
  actionStack: ViewStyle;
}

export interface MediaLibraryStyles {
  styles: MediaLibraryBaseStyles;
  cancelButtonStyles: CustomButtonStyles;
  gridItemSize: number;
}

export function useMediaLibraryStyles(): MediaLibraryStyles {
  const {
    createAppPageStyles,
    overrideStyles,
    colors,
    spacingPresets,
    typographyPresets,
    borderRadiusPresets,
    buttonPresets,
  } = useStyleContext();
  const { dimensions } = useResponsiveDesign();

  // Calculate grid item size based on screen width
  const availableWidth = Math.min(dimensions.width - spacingPresets.md2 * 2, CONTENT_MAX_WIDTH_PX);
  const numColumns = 3;
  const gridItemSize = Math.floor((availableWidth - GRID_GAP_PX * (numColumns - 1)) / numColumns);

  const styles: MediaLibraryBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: spacingPresets.md2,
      paddingVertical: spacingPresets.md2,
    },
    header: {
      gap: spacingPresets.xs,
      marginBottom: spacingPresets.md1,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryForeground,
      textAlign: 'left',
    },
    subtitle: {
      ...typographyPresets.Body,
      color: colors.tertiaryForeground,
      textAlign: 'left',
    },
    filterTabs: {
      flexDirection: 'row',
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.xxs,
      gap: spacingPresets.xxs,
      marginBottom: spacingPresets.md1,
    },
    filterTab: {
      flex: 1,
      height: FILTER_TAB_HEIGHT_PX,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadiusPresets.components - 2,
      paddingHorizontal: spacingPresets.xs,
    },
    filterTabActive: {
      backgroundColor: colors.primaryBackground,
    },
    filterTabText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
    },
    filterTabTextActive: {
      color: colors.primaryForeground,
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GRID_GAP_PX,
    },
    gridItem: {
      width: gridItemSize,
      height: gridItemSize,
      borderRadius: borderRadiusPresets.components,
      overflow: 'hidden',
      backgroundColor: colors.secondaryBackground,
    },
    gridItemImage: {
      width: '100%',
      height: '100%',
    },
    gridItemOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: spacingPresets.xxs,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    gridItemIcon: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: -16,
      marginLeft: -16,
    },
    gridItemDuration: {
      ...typographyPresets.Caption,
      color: colors.primaryBackground,
      fontSize: 10,
      lineHeight: 12,
    },
    gridItemFavorite: {
      position: 'absolute',
      top: spacingPresets.xxs,
      right: spacingPresets.xxs,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacingPresets.md1,
      paddingVertical: spacingPresets.xl,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      ...typographyPresets.Label,
      color: colors.primaryForeground,
      textAlign: 'center',
    },
    emptyHint: {
      ...typographyPresets.Body,
      color: colors.tertiaryForeground,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      ...typographyPresets.Caption,
      color: colors.customColors.error,
      textAlign: 'center',
      marginBottom: spacingPresets.sm,
    },
    actionStack: {
      gap: spacingPresets.sm,
      marginTop: spacingPresets.md1,
    },
  };

  const cancelButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      width: '100%',
    },
    text: {
      color: colors.tertiaryForeground,
    },
    icon: {
      color: colors.tertiaryForeground,
    },
  });

  return createAppPageStyles<MediaLibraryStyles>({
    styles,
    cancelButtonStyles,
    gridItemSize,
  });
}

