/**
 * Main container for the Assistant route - AI Math Tutor Chat Interface
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { KeyboardAvoidingView, View, Platform, Image, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { ChatInputFooter } from '@/comp-lib/chat/input-footer/ChatInputFooter';
import { CustomHeader } from '@/comp-lib/custom-header/CustomHeader';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { LatexRenderer } from '@/comp-app/latex-renderer/LatexRenderer';
import { MediaCapture } from '@/comp-app/media-capture/MediaCapture';
import { MediaLibrary } from '@/comp-app/media-library/MediaLibrary';
import { InlineVoiceRecorder } from '@/comp-app/inline-voice-recorder/InlineVoiceRecorder';
import { useAssistantStyles, type AssistantBaseStyles, type QuickActionChipStyles, type LatexMessageStyles, type MediaActionStyles } from './AssistantStyles';
import { useAssistant, type ChatMessageItem, type SolutionStep, type QuickActionOption, type QuickActionType } from './AssistantFunc';
import { AssistantProps } from '@/app/assistant';

interface SolutionStepsProps {
  steps: SolutionStep[];
  styles: AssistantBaseStyles;
}

function SolutionSteps(props: SolutionStepsProps): ReactNode {
  return (
    <View>
      {props.steps.map((step) => (
        <View key={step.stepNumber} style={props.styles.solutionStepContainer}>
          <View style={props.styles.stepNumberBadge}>
            <CustomTextField title={String(step.stepNumber)} styles={props.styles.stepNumberText} />
          </View>
          <View style={props.styles.stepContent}>
            <CustomTextField title={step.explanation} styles={props.styles.stepText} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface CelebrationBadgeProps {
  text: string;
  styles: AssistantBaseStyles;
}

function CelebrationBadge(props: CelebrationBadgeProps): ReactNode {
  return (
    <View style={props.styles.celebrationContainer}>
      <CustomTextField title={props.text} styles={props.styles.celebrationText} />
    </View>
  );
}

interface QuickActionsProps {
  options: QuickActionOption[];
  onPress: (actionId: QuickActionType) => void;
  styles: AssistantBaseStyles;
  chipStyles: QuickActionChipStyles;
}

function QuickActions(props: QuickActionsProps): ReactNode {
  return (
    <View style={props.styles.quickActionsContainer}>
      {props.options.map((option) => (
        <CustomButton
          key={option.id}
          title={option.label}
          onPress={() => props.onPress(option.id)}
          styles={props.chipStyles.chipButton}
        />
      ))}
    </View>
  );
}

interface MediaActionsProps {
  onCapturePhoto: () => void;
  onCaptureVoice: () => void;
  onOpenLibrary: () => void;
  styles: MediaActionStyles;
}

function MediaActions(props: MediaActionsProps): ReactNode {
  const { colors } = useStyleContext();
  
  return (
    <View style={props.styles.container}>
      <Pressable style={props.styles.actionButton} onPress={props.onCapturePhoto}>
        <Ionicons name="camera" size={20} color={colors.primaryAccent} />
      </Pressable>
      <Pressable style={props.styles.actionButton} onPress={props.onCaptureVoice}>
        <Ionicons name="mic" size={20} color={colors.primaryAccent} />
      </Pressable>
      <Pressable style={props.styles.actionButton} onPress={props.onOpenLibrary}>
        <Ionicons name="images" size={20} color={colors.primaryAccent} />
      </Pressable>
    </View>
  );
}

interface TutorAvatarProps {
  styles: AssistantBaseStyles;
}

function TutorAvatar(props: TutorAvatarProps): ReactNode {
  return (
    <View style={props.styles.tutorAvatarContainer}>
      <CustomTextField title="L" styles={props.styles.tutorAvatarText} />
    </View>
  );
}

interface ChatMessageBubbleProps {
  item: ChatMessageItem;
  styles: AssistantBaseStyles;
  latexStyles: LatexMessageStyles;
}

function ChatMessageBubble(props: ChatMessageBubbleProps): ReactNode {
  const { item, styles, latexStyles } = props;
  const hasSolutionSteps = item.solutionSteps != null && item.solutionSteps.length > 0;
  const isCelebration = item.isCelebration === true && item.celebrationText != null;

  if (item.isCurrentUser) {
    // User messages - simple text rendering
    return (
      <View style={styles.messageRow}>
        <View style={styles.userBubble}>
          <CustomTextField title={item.contentText} styles={styles.userBubbleText} />
        </View>
      </View>
    );
  }

  // AI messages - use LaTeX renderer
  return (
    <View style={styles.messageRow}>
      <TutorAvatar styles={styles} />
      <View style={styles.aiBubble}>
        {!isCelebration && (
          <LatexRenderer
            content={item.contentText}
            textColor={latexStyles.textColor}
            fontSize={latexStyles.fontSize}
          />
        )}
        {hasSolutionSteps && <SolutionSteps steps={item.solutionSteps!} styles={styles} />}
        {isCelebration && <CelebrationBadge text={item.celebrationText!} styles={styles} />}
      </View>
    </View>
  );
}

export default function AssistantContainer(props: AssistantProps): ReactNode {
  const {
    messages,
    inputText,
    isSendDisabled,
    messagesListRef,
    inputRef,
    multiline,
    keyboardVerticalOffset,
    problemImageUri,
    problemVoiceUri,
    quickActionOptions,
    isMediaCaptureVisible,
    isMediaLibraryVisible,
    isSubmittingMedia,
    mediaCaptureMode,
    isInlineRecording,
    setInputText,
    onSend,
    onQuickActionPress,
    onGoBack,
    onNewChat,
    onOpenMediaCapture,
    onCloseMediaCapture,
    onSubmitMedia,
    onOpenMediaLibrary,
    onCloseMediaLibrary,
    onSelectLibraryMedia,
    onStartInlineRecording,
    onInlineRecordingComplete,
    onInlineRecordingError,
    onInlineRecordingCancel,
  } = useAssistant(props);
  const { styles, customTextInputStyles, chatInputFooterBaseStyles, customHeaderStyles, quickActionChipStyles, latexMessageStyles, mediaActionStyles, newChatButtonStyles } = useAssistantStyles(multiline);
  const { colors } = useStyleContext();

  const { isPlatformWeb } = useResponsiveDesign();
  const wrapperProps = {};

  function renderMessageItem({ item }: { item: ChatMessageItem }): ReactElement | null {
    return (
      <ChatMessageBubble
        item={item}
        styles={styles}
        latexStyles={latexMessageStyles}
      />
    );
  }

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <View style={styles.container}>
        <CustomHeader
          title="Math Tutor"
          showBackButton={true}
          onGoBack={onGoBack}
          customHeaderStyles={customHeaderStyles}
          RightComponent={
            <CustomButton
              title="New"
              onPress={onNewChat}
              styles={newChatButtonStyles}
            />
          }
        />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View style={styles.subContainer}>
            {problemImageUri && (
              <View style={styles.problemImageContainer}>
                <Image source={{ uri: problemImageUri }} style={styles.problemImage} />
                <CustomTextField title="Your math problem" styles={styles.problemImageLabel} />
              </View>
            )}
            {problemVoiceUri && !problemImageUri && (
              <View style={styles.problemVoiceContainer}>
                <View style={styles.problemVoiceIcon}>
                  <Ionicons name="mic" size={24} color={colors.primaryAccent} />
                </View>
                <CustomTextField title="Voice recording attached" styles={styles.problemVoiceLabel} />
              </View>
            )}
            <Animated.FlatList
              ref={messagesListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={styles.chatList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
          <QuickActions
            options={quickActionOptions}
            onPress={onQuickActionPress}
            styles={styles}
            chipStyles={quickActionChipStyles}
          />
          {isInlineRecording ? (
            <InlineVoiceRecorder
              isRecording={isInlineRecording}
              onRecordingComplete={onInlineRecordingComplete}
              onRecordingError={onInlineRecordingError}
              onRecordingCancel={onInlineRecordingCancel}
            />
          ) : (
            <MediaActions
              onCapturePhoto={() => onOpenMediaCapture('image')}
              onCaptureVoice={onStartInlineRecording}
              onOpenLibrary={onOpenMediaLibrary}
              styles={mediaActionStyles}
            />
          )}
          <ChatInputFooter
            inputRef={inputRef}
            inputText={inputText}
            multiline={multiline}
            onInputChange={setInputText}
            onSend={onSend}
            isSendDisabled={isSendDisabled}
            chatInputFooterBaseStyles={chatInputFooterBaseStyles}
            customTextInputStyles={customTextInputStyles}
          />
        </KeyboardAvoidingView>
      </View>

      <MediaCapture
        isVisible={isMediaCaptureVisible}
        isSubmitting={isSubmittingMedia}
        initialMode={mediaCaptureMode}
        onCancel={onCloseMediaCapture}
        onSubmitMedia={onSubmitMedia}
      />

      <MediaLibrary
        isVisible={isMediaLibraryVisible}
        onCancel={onCloseMediaLibrary}
        onSelectMedia={onSelectLibraryMedia}
      />
    </OptionalWrapper>
  );
}
