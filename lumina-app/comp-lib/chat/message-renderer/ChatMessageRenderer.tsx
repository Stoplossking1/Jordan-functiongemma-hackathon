import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import type { uuidstr, timestamptzstr } from '@shared/generated-db-types';
import { ChatMessageRendererStyles, useChatMessageRendererStyles } from './ChatMessageRendererStyles';

export interface BaseChatMessageItem {
  id: uuidstr;
  contentText: string;
  createdAt?: timestamptzstr;
  isCurrentUser: boolean;
}

interface ChatMessageRendererProps {
  messageContentText: string;
  isUserMessage: boolean;
  avatarInitials?: string;
  // will replace avatarInitials if provided
  AvatarComponent?: ReactNode;
  senderName?: string;
  // will replace senderName if provided
  SenderNameComponent?: ReactNode;
  showOnlyCustomMessageComponent?: boolean;
  CustomMessageComponent?: ReactNode;
  ChatDateSeparatorComponent?: ReactNode;
  ReplySuggestionsComponent?: ReactNode;
  MetadataComponent?: ReactNode;
  showOnlyBubbleBellowMessageComponent?: boolean;
  BubbleBellowMessageComponent?: ReactNode;
  chatMessageRendererStyles?: ChatMessageRendererStyles;
}

export function ChatMessageRenderer(props: ChatMessageRendererProps): ReactNode {
  const defaultStyles = useChatMessageRendererStyles();
  const styles = props.chatMessageRendererStyles ?? defaultStyles;

  return (
    <View style={styles.container}>
      {props.ChatDateSeparatorComponent}
      {!props.showOnlyCustomMessageComponent && (
        <View
          style={[
            styles.avatarMessageContainer,
            props.isUserMessage && styles.avatarMessageContainerRight,
            !props.isUserMessage && styles.avatarMessageContainerLeft,
          ]}
        >
          {props.avatarInitials && !props.AvatarComponent && (
            <View
              style={[
                styles.avatar,
                props.isUserMessage && styles.avatarRight,
                !props.isUserMessage && styles.avatarLeft,
              ]}
            >
              <CustomTextField
                title={props.avatarInitials}
                styles={[
                  styles.avatarText,
                  props.isUserMessage && styles.avatarRightText,
                  !props.isUserMessage && styles.avatarLeftText,
                ]}
              />
            </View>
          )}
          {props.AvatarComponent}
          <View
            style={[
              styles.messageContainer,
              props.isUserMessage && styles.messageContainerRight,
              !props.isUserMessage && styles.messageContainerLeft,
            ]}
          >
            {props.senderName && !props.SenderNameComponent && (
              <CustomTextField title={props.senderName} styles={[styles.senderNameText]} />
            )}
            {props.SenderNameComponent}
            <View
              style={[
                styles.bubble,
                props.isUserMessage && styles.rightBubble,
                !props.isUserMessage && styles.leftBubble,
              ]}
            >
              {!props.showOnlyBubbleBellowMessageComponent && (
                <CustomTextField
                  title={props.messageContentText}
                  styles={[
                    props.isUserMessage && styles.rightBubbleText,
                    !props.isUserMessage && styles.leftBubbleText,
                  ]}
                />
              )}
              {props.BubbleBellowMessageComponent}
            </View>
            {props.MetadataComponent}
            {props.ReplySuggestionsComponent}
          </View>
        </View>
      )}
      {props.CustomMessageComponent}
    </View>
  );
}
