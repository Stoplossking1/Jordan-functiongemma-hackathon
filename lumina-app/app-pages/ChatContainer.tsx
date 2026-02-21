/**
 * Main container for the Chat History route
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { View, FlatList, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { CustomHeader } from '@/comp-lib/custom-header/CustomHeader';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextInput } from '@/comp-lib/core/custom-text-input/CustomTextInput';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { useChatStyles, type ConversationItemStyles, type EmptyStateStyles } from './ChatStyles';
import { formatConversationRelativeTime, useChat, type ConversationHistoryItem } from './ChatFunc';
import { ChatProps } from '@/app/chat';
import { type uuidstr } from '@shared/generated-db-types';

interface ConversationListItemProps {
  item: ConversationHistoryItem;
  styles: ConversationItemStyles;
  isDeleting: boolean;
  onPress: (id: uuidstr) => void;
  onDelete: (id: uuidstr) => void;
}

function ConversationListItem(props: ConversationListItemProps): ReactNode {
  const { item, styles, isDeleting, onPress, onDelete } = props;
  const isSolvedStatus = item.status === 'solved';
  const statusIconName = isSolvedStatus ? 'checkmark-circle' : 'time-outline';
  const statusLabel = isSolvedStatus ? 'Solved' : 'In Progress';
  const statusTextStyles = isSolvedStatus ? styles.solvedStatusText : styles.inProgressStatusText;
  const statusIconColor = statusTextStyles.color as string;
  const deleteIconColor = styles.deleteIconColor.color as string;

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.pressable, isDeleting ? styles.pressableDisabled : undefined]}
        onPress={() => onPress(item.id)}
        disabled={isDeleting}
      >
        <View style={styles.thumbnailContainer}>
          {item.thumbnailUri ? (
            <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <View style={styles.thumbnailIconWrapper}>
                <Ionicons name="camera-outline" size={24} color={styles.thumbnailPlaceholderText.color as string} />
              </View>
            </View>
          )}
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <View style={styles.topicTag}>
              <CustomTextField styles={styles.topicTagText} title={item.topicTag} allowFontScaling={false} />
            </View>
            <CustomTextField
              styles={styles.dateText}
              title={formatConversationRelativeTime(item.createdAt)}
              allowFontScaling={false}
            />
          </View>
          <CustomTextField
            styles={styles.previewText}
            title={item.previewText}
            numberOfLines={1}
            allowFontScaling={false}
          />
          <View style={styles.bottomRow}>
            <View style={styles.statusContainer}>
              <View style={styles.statusIconWrapper}>
                <Ionicons name={statusIconName} size={14} color={statusIconColor} />
              </View>
              <CustomTextField styles={statusTextStyles} title={statusLabel} allowFontScaling={false} />
            </View>
            <Pressable
              style={[styles.deleteButton, isDeleting ? styles.deleteButtonDisabled : undefined]}
              onPress={() => onDelete(item.id)}
              disabled={isDeleting}
            >
              <View style={styles.deleteIconWrapper}>
                <Ionicons name="trash-outline" size={18} color={deleteIconColor} />
              </View>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

interface EmptyStateProps {
  styles: EmptyStateStyles;
  title: string;
  subtitle: string;
  iconColor: string;
}

function EmptyState(props: EmptyStateProps): ReactNode {
  const { styles, iconColor, title, subtitle } = props;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconWrapper}>
          <Ionicons name="chatbubbles-outline" size={48} color={iconColor} />
        </View>
      </View>
      <CustomTextField styles={styles.title} title={title} allowFontScaling={false} />
      <CustomTextField styles={styles.subtitle} title={subtitle} allowFontScaling={false} />
    </View>
  );
}

export default function ChatContainer(props: ChatProps): ReactNode {
  const {
    conversations,
    searchText,
    isLoading,
    isEmptyState,
    isSearchEmptyState,
    loadErrorMessage,
    pendingDeleteConversationId,
    listRef,
    onSearchChange,
    onConversationPress,
    onDeleteConversation,
    onRetryLoad,
    onGoBack,
  } = useChat(props);
  const { styles, headerStyles, searchInputStyles, retryButtonStyles, conversationItemStyles, emptyStateStyles } =
    useChatStyles();

  const { isPlatformWeb } = useResponsiveDesign();
  const emptyStateIconColor = emptyStateStyles.subtitle.color as string;
  const hasVisibleConversations = conversations.length > 0;
  const shouldShowLoadingState = isLoading && !hasVisibleConversations;
  const shouldShowErrorState = loadErrorMessage != null && !hasVisibleConversations;

  function renderConversationItem({ item }: { item: ConversationHistoryItem }): ReactElement {
    return (
      <ConversationListItem
        item={item}
        styles={conversationItemStyles}
        isDeleting={pendingDeleteConversationId === item.id}
        onPress={onConversationPress}
        onDelete={onDeleteConversation}
      />
    );
  }

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={{}}>
      <View style={styles.container}>
        <CustomHeader title="My Chats" showBackButton={true} onGoBack={onGoBack} customHeaderStyles={headerStyles} />
        <View style={styles.contentContainer}>
          <View style={styles.searchContainer}>
            <CustomTextInput
              styles={searchInputStyles}
              value={searchText}
              onChangeText={onSearchChange}
              placeholder="Search by topic or problem..."
              leftIonIconsName="search"
              editable={!isLoading}
            />
          </View>
          {shouldShowLoadingState ? (
            <View style={styles.feedbackStateContainer}>
              <CustomTextField styles={styles.feedbackTitle} title="Loading chats..." />
              <CustomTextField styles={styles.feedbackSubtitle} title="Please wait a moment." />
            </View>
          ) : shouldShowErrorState ? (
            <View style={styles.feedbackStateContainer}>
              <CustomTextField styles={styles.feedbackTitle} title={"Couldn't load chats"} />
              <CustomTextField
                styles={styles.feedbackSubtitle}
                title={loadErrorMessage ?? 'Please try again.'}
              />
              <CustomButton title="Retry" onPress={onRetryLoad} styles={retryButtonStyles} />
            </View>
          ) : isEmptyState ? (
            <EmptyState
              styles={emptyStateStyles}
              title="No chats yet"
              subtitle="Snap your first problem!"
              iconColor={emptyStateIconColor}
            />
          ) : isSearchEmptyState ? (
            <EmptyState
              styles={emptyStateStyles}
              title="No matches"
              subtitle="Try another keyword."
              iconColor={emptyStateIconColor}
            />
          ) : (
            <FlatList
              ref={listRef}
              style={styles.listContainer}
              contentContainerStyle={styles.listContentContainer}
              data={conversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id}
              refreshing={isLoading}
              onRefresh={onRetryLoad}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </OptionalWrapper>
  );
}
