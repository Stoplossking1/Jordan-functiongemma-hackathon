/**
 * Main container for the Assistant route - AI Math Tutor Chat Interface
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { KeyboardAvoidingView, View, Platform, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { ChatMessageRenderer } from '@/comp-lib/chat/message-renderer/ChatMessageRenderer';
import { ChatInputFooter } from '@/comp-lib/chat/input-footer/ChatInputFooter';
import { CustomHeader } from '@/comp-lib/custom-header/CustomHeader';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { useAssistantStyles, type AssistantBaseStyles, type QuickActionChipStyles } from './AssistantStyles';
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
    quickActionOptions,
    setInputText,
    onSend,
    onQuickActionPress,
    onGoBack,
  } = useAssistant(props);
  const { styles, customTextInputStyles, chatInputFooterBaseStyles, customHeaderStyles, chatMessageRendererStyles, quickActionChipStyles } = useAssistantStyles(multiline);

  const { isPlatformWeb } = useResponsiveDesign();
  const wrapperProps = {};

  function renderMessageItem({ item }: { item: ChatMessageItem }): ReactElement | null {
    const hasSolutionSteps = item.solutionSteps != null && item.solutionSteps.length > 0;
    const isCelebration = item.isCelebration === true && item.celebrationText != null;

    return (
      <ChatMessageRenderer
        messageContentText={item.contentText}
        isUserMessage={item.isCurrentUser}
        avatarInitials={item.isCurrentUser ? undefined : 'L'}
        AvatarComponent={item.isCurrentUser ? undefined : <TutorAvatar styles={styles} />}
        chatMessageRendererStyles={chatMessageRendererStyles}
        BubbleBellowMessageComponent={
          hasSolutionSteps ? (
            <SolutionSteps steps={item.solutionSteps!} styles={styles} />
          ) : isCelebration ? (
            <CelebrationBadge text={item.celebrationText!} styles={styles} />
          ) : undefined
        }
        showOnlyBubbleBellowMessageComponent={isCelebration}
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
    </OptionalWrapper>
  );
}
