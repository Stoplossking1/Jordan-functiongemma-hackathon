import { type ReactNode } from 'react';
import { Image, type ImageSource } from 'expo-image';
import { type Session } from '@supabase/supabase-js';
import { getPrivateAssetHeaders } from '@/api/asset-api';
import { useThemedStyles } from '@/comp-lib/styles/useThemedStyles';

export interface ImageViewerProps {
  /**
   * Fallback image to display when no imageSource or imageUrl is provided
   */
  placeholderImageSource: ImageSource;

  /**
   * Direct image source (highest priority)
   */
  imageSource?: ImageSource;

  /**
   * URL of the image (second priority)
   */
  imageUrl?: string;

  /**
   * User session for accessing private assets
   */
  session?: Session;

  /**
   * Styles for actual image (when imageSource or imageUrl is provided)
   */
  imageStyles?: object;

  /**
   * Styles for placeholder image
   */
  placeholderImageStyles?: object;
}

export default function ImageViewer(props: ImageViewerProps): ReactNode {
  const { colors } = useThemedStyles();

  // Determine the final source based on precedence
  // 1. Direct imageSource
  // 2. URL-based source with auth headers if needed
  // 3. Placeholder image
  const finalSource = (() => {
    // If direct imageSource is provided, use it
    if (props.imageSource) {
      return props.imageSource;
    }

    // If imageUrl is provided, create a source with appropriate headers
    if (props.imageUrl) {
      return {
        uri: props.imageUrl,
        headers: props.session ? getPrivateAssetHeaders(props.session) : {},
      } satisfies ImageSource;
    }

    // Fall back to placeholder
    return props.placeholderImageSource;
  })();

  // Determine if we're showing a placeholder or actual image
  const isPlaceholder = !props.imageSource && !props.imageUrl;

  return (
    <Image
      // Apply tint color only for placeholder images
      tintColor={isPlaceholder ? colors.tertiaryForeground : null}
      source={finalSource}
      // Use appropriate styles based on whether we're showing a placeholder or not
      style={isPlaceholder ? props.placeholderImageStyles : props.imageStyles}
    />
  );
}
