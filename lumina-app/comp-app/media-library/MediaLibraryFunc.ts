/**
 * Business logic for the MediaLibrary component - browse and select saved media
 */

import { useState, useEffect, useCallback } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import {
  readAllUserMedia,
  readRecentUserMedia,
  readFavoriteUserMedia,
  updateUserMedia,
  deleteUserMedia,
  recordUserMediaUsage,
  getSignedMediaUrl,
  deleteUserMediaFile,
} from '@shared/lumina-db';
import { type MediaType, type UserMediaV1, toUuidStr } from '@shared/generated-db-types';

export type MediaLibraryFilter = 'all' | 'images' | 'recordings' | 'favorites' | 'recent';

export interface MediaItemWithUrl extends UserMediaV1 {
  signedUrl?: string;
}

export interface MediaLibraryProps {
  isVisible: boolean;
  filter?: MediaLibraryFilter;
  onCancel: () => void;
  onSelectMedia: (media: MediaItemWithUrl) => void;
}

export interface MediaLibraryFunc {
  mediaItems: MediaItemWithUrl[];
  isLoading: boolean;
  filter: MediaLibraryFilter;
  errorMessage?: string;
  onFilterChange: (filter: MediaLibraryFilter) => void;
  onSelectItem: (media: MediaItemWithUrl) => void;
  onToggleFavorite: (mediaId: string) => void;
  onDeleteItem: (mediaId: string) => void;
  onRefresh: () => void;
  onCancel: () => void;
}

const FILTER_TO_MEDIA_TYPE: Record<MediaLibraryFilter, MediaType | undefined> = {
  all: undefined,
  images: 'IMAGE',
  recordings: 'VOICE_RECORDING',
  favorites: undefined,
  recent: undefined,
};

const LOAD_ERROR_MESSAGE = 'Could not load your media. Please try again.';
const DELETE_ERROR_MESSAGE = 'Could not delete the media. Please try again.';
const FAVORITE_ERROR_MESSAGE = 'Could not update favorite status.';

export function useMediaLibrary(props: MediaLibraryProps): MediaLibraryFunc {
  const [mediaItems, setMediaItems] = useState<MediaItemWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<MediaLibraryFilter>(props.filter ?? 'recent');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const loadMediaAsync = useCallback(async (currentFilter: MediaLibraryFilter): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage(undefined);

      let media: UserMediaV1[] = [];

      switch (currentFilter) {
        case 'recent':
          media = await readRecentUserMedia(supabaseClient, 20);
          break;
        case 'favorites':
          media = await readFavoriteUserMedia(supabaseClient);
          break;
        case 'images':
        case 'recordings':
        case 'all':
          media = await readAllUserMedia(supabaseClient, {
            mediaType: FILTER_TO_MEDIA_TYPE[currentFilter],
            limit: 50,
          });
          break;
      }

      // Get signed URLs for all media items
      const mediaWithUrls: MediaItemWithUrl[] = await Promise.all(
        media.map(async (item) => {
          try {
            const signedUrl = item.storagePath != null ? await getSignedMediaUrl(supabaseClient, item.storagePath) : undefined;
            return { ...item, signedUrl };
          } catch {
            return { ...item, signedUrl: undefined };
          }
        }),
      );

      setMediaItems(mediaWithUrls);
    } catch (error) {
      console.error('loadMediaAsync error:', error);
      setErrorMessage(LOAD_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load media when modal becomes visible or filter changes
  useEffect(() => {
    if (props.isVisible) {
      loadMediaAsync(filter).catch(console.error);
    } else {
      setMediaItems([]);
      setErrorMessage(undefined);
    }
  }, [props.isVisible, filter, loadMediaAsync]);

  function onFilterChange(newFilter: MediaLibraryFilter): void {
    if (isLoading) {
      return;
    }
    setFilter(newFilter);
  }

  async function handleSelectItemAsync(media: MediaItemWithUrl): Promise<void> {
    try {
      // Record usage to update last_used_at and use_count
      await recordUserMediaUsage(supabaseClient, media.id);
      props.onSelectMedia(media);
    } catch (error) {
      console.error('handleSelectItemAsync error:', error);
      // Still select the media even if recording usage fails
      props.onSelectMedia(media);
    }
  }

  function onSelectItem(media: MediaItemWithUrl): void {
    handleSelectItemAsync(media).catch(console.error);
  }

  async function handleToggleFavoriteAsync(mediaId: string): Promise<void> {
    try {
      const item = mediaItems.find((m) => m.id === mediaId);
      if (item == null) {
        return;
      }

      const newFavoriteStatus = !item.isFavorite;
      await updateUserMedia(supabaseClient, toUuidStr(mediaId), { isFavorite: newFavoriteStatus });

      // Update local state
      setMediaItems((prev) => prev.map((m) => (m.id === mediaId ? { ...m, isFavorite: newFavoriteStatus } : m)));

      // If we're on favorites filter and unfavoriting, remove from list
      if (filter === 'favorites' && !newFavoriteStatus) {
        setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
      }
    } catch (error) {
      console.error('handleToggleFavoriteAsync error:', error);
      setErrorMessage(FAVORITE_ERROR_MESSAGE);
    }
  }

  function onToggleFavorite(mediaId: string): void {
    handleToggleFavoriteAsync(mediaId).catch(console.error);
  }

  async function handleDeleteItemAsync(mediaId: string): Promise<void> {
    try {
      const item = mediaItems.find((m) => m.id === mediaId);
      if (item == null) {
        return;
      }

      // Delete from storage first
      if (item.storagePath != null) {
        await deleteUserMediaFile(supabaseClient, item.storagePath);
      }

      // Delete from database
      await deleteUserMedia(supabaseClient, toUuidStr(mediaId));

      // Update local state
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (error) {
      console.error('handleDeleteItemAsync error:', error);
      setErrorMessage(DELETE_ERROR_MESSAGE);
    }
  }

  function onDeleteItem(mediaId: string): void {
    handleDeleteItemAsync(mediaId).catch(console.error);
  }

  function onRefresh(): void {
    loadMediaAsync(filter).catch(console.error);
  }

  function onCancel(): void {
    props.onCancel();
  }

  return {
    mediaItems,
    isLoading,
    filter,
    errorMessage,
    onFilterChange,
    onSelectItem,
    onToggleFavorite,
    onDeleteItem,
    onRefresh,
    onCancel,
  };
}

