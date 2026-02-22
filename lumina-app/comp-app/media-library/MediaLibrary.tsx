import { type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { useMediaLibrary, type MediaLibraryProps, type MediaLibraryFilter, type MediaItemWithUrl } from './MediaLibraryFunc';
import { useMediaLibraryStyles } from './MediaLibraryStyles';

const TITLE = 'Your Media Library';
const SUBTITLE = 'Select a saved image or recording to use.';
const EMPTY_TITLE = 'No media yet';
const EMPTY_HINT = 'Capture photos or record voice messages to build your library.';

const FILTER_LABELS: Record<MediaLibraryFilter, string> = {
  recent: 'Recent',
  all: 'All',
  images: 'Photos',
  recordings: 'Voice',
  favorites: 'Favorites',
};

function formatDuration(durationInMs: number | null | undefined): string {
  if (durationInMs == null) {
    return '0:00';
  }
  const totalSeconds = Math.floor(durationInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function MediaLibrary(props: MediaLibraryProps): ReactNode {
  const { mediaItems, isLoading, filter, errorMessage, onFilterChange, onSelectItem, onToggleFavorite, onCancel } =
    useMediaLibrary(props);

  const { styles, cancelButtonStyles, gridItemSize } = useMediaLibraryStyles();
  const { colors } = useStyleContext();
  const { isPlatformWeb } = useResponsiveDesign();

  const wrapperProps = { edges: ['top', 'left', 'right', 'bottom'] };
  const hasMedia = mediaItems.length > 0;
  const filterOptions: MediaLibraryFilter[] = ['recent', 'all', 'images', 'recordings', 'favorites'];

  if (!props.isVisible) {
    return null;
  }

  function renderFilterTabs(): ReactNode {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
        {filterOptions.map((filterOption) => (
          <Pressable
            key={filterOption}
            style={[styles.filterTab, filter === filterOption && styles.filterTabActive]}
            onPress={() => onFilterChange(filterOption)}
            disabled={isLoading}
          >
            <CustomTextField
              styles={{ ...styles.filterTabText, ...(filter === filterOption ? styles.filterTabTextActive : {}) }}
              title={FILTER_LABELS[filterOption]}
            />
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  function renderMediaItem(item: MediaItemWithUrl): ReactNode {
    const isImage = item.mediaType === 'IMAGE';
    const isVoice = item.mediaType === 'VOICE_RECORDING';

    return (
      <Pressable key={item.id} style={[styles.gridItem, { width: gridItemSize, height: gridItemSize }]} onPress={() => onSelectItem(item)}>
        {isImage && item.signedUrl != null ? (
          <Image source={{ uri: item.signedUrl }} style={styles.gridItemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.gridItemImage, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name={isVoice ? 'mic' : 'image'} size={32} color={colors.tertiaryForeground} />
          </View>
        )}

        {isVoice && (
          <View style={styles.gridItemOverlay}>
            <CustomTextField styles={styles.gridItemDuration} title={formatDuration(item.durationInMs)} />
          </View>
        )}

        <Pressable
          style={styles.gridItemFavorite}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
        >
          <Ionicons name={item.isFavorite ? 'heart' : 'heart-outline'} size={20} color={item.isFavorite ? colors.customColors.error : colors.primaryBackground} />
        </Pressable>
      </Pressable>
    );
  }

  function renderContent(): ReactNode {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAccent} />
        </View>
      );
    }

    if (!hasMedia) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="images-outline" size={32} color={colors.tertiaryForeground} />
          </View>
          <CustomTextField styles={styles.emptyText} title={EMPTY_TITLE} />
          <CustomTextField styles={styles.emptyHint} title={EMPTY_HINT} />
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>{mediaItems.map(renderMediaItem)}</View>
      </ScrollView>
    );
  }

  return (
    <Modal visible={props.isVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
        <View style={styles.container}>
          <View style={styles.header}>
            <CustomTextField styles={styles.title} title={TITLE} />
            <CustomTextField styles={styles.subtitle} title={SUBTITLE} />
          </View>

          {renderFilterTabs()}

          {errorMessage ? <CustomTextField styles={styles.errorText} title={errorMessage} /> : undefined}

          {renderContent()}

          <View style={styles.actionStack}>
            <CustomButton title="Cancel" onPress={onCancel} styles={cancelButtonStyles} />
          </View>
        </View>
      </OptionalWrapper>
    </Modal>
  );
}

export type { MediaLibraryProps, MediaLibraryFilter, MediaItemWithUrl } from './MediaLibraryFunc';

