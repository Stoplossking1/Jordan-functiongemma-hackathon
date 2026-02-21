/**
 * Main container for the Profile route
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, Pressable, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { CustomTextInput } from '@/comp-lib/core/custom-text-input/CustomTextInput';
import { CustomCheckboxList } from '@/comp-lib/core/custom-checkbox-list/CustomCheckboxList';
import { CustomSwitch } from '@/comp-lib/core/custom-switch/CustomSwitch';
import { useProfileStyles, type ProfileBaseStyles } from './ProfileStyles';
import { useProfile, type GradeLevelValue, GRADE_LEVEL_OPTIONS } from './ProfileFunc';
import { type MathTopic } from '@shared/generated-db-types';
import { ProfileProps } from '@/app/(tabs)/profile';
import { t } from '@/i18n';

interface GradePickerProps {
  styles: ProfileBaseStyles;
  selectedGrade: GradeLevelValue;
  onSelectGrade: (grade: GradeLevelValue) => void;
}

function GradePicker(props: GradePickerProps): ReactNode {
  const { styles, selectedGrade, onSelectGrade } = props;

  return (
    <View style={styles.gradePickerContainer}>
      {GRADE_LEVEL_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.gradeOption, selectedGrade === option.value && styles.gradeOptionSelected]}
          onPress={() => onSelectGrade(option.value)}
        >
          <CustomTextField
            styles={[styles.gradeOptionText, selectedGrade === option.value && styles.gradeOptionTextSelected]}
            title={option.label}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function ProfileContainer(props: ProfileProps): ReactNode {
  const {
    styles,
    editButtonStyles,
    signOutButtonStyles,
    shareButtonStyles,
    checkboxStyles,
    switchStyles,
    nameInputStyles,
    modalPrimaryButtonStyles,
    modalSecondaryButtonStyles,
  } = useProfileStyles();

  const {
    displayName,
    isEditingName,
    gradeLevel,
    isEditingGrade,
    selectedTopics,
    notificationsEnabled,
    topicOptions,
    appVersion,
    onStartEditName,
    onCancelEditName,
    onChangeDisplayName,
    onSaveDisplayName,
    onStartEditGrade,
    onCancelEditGrade,
    onChangeGradeLevel,
    onSaveGradeLevel,
    onToggleTopics,
    onToggleNotifications,
    onNavigateToChatHistory,
    onShareProgress,
    onLogout,
  } = useProfile(props);

  const { isPlatformWeb } = useResponsiveDesign();
  const { colors } = useStyleContext();
  const wrapperProps = { edges: ['top', 'left', 'right'] };

  const gradeLabel = GRADE_LEVEL_OPTIONS.find((opt) => opt.value === gradeLevel)?.label ?? '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function handleSignOut(): void {
    onLogout(() => props.onNavigateToAuth());
  }

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <CustomTextField styles={styles.avatarText} title={initials} />
            </View>
            <View style={styles.profileInfo}>
              <CustomTextField styles={styles.rowValue} title={displayName} />
              <CustomTextField styles={styles.rowLabel} title={gradeLabel} />
            </View>
          </View>

          {/* Profile Details Section */}
          <View style={styles.sectionContainer}>
            <CustomTextField styles={styles.sectionTitle} title="Profile" />

            <View style={styles.editableRow}>
              <CustomTextField styles={styles.rowLabel} title="Display Name" />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomTextField styles={styles.rowValue} title={displayName} />
                <CustomButton title="Edit" styles={editButtonStyles} onPress={onStartEditName} />
              </View>
            </View>

            <View style={styles.editableRow}>
              <CustomTextField styles={styles.rowLabel} title="Grade Level" />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CustomTextField styles={styles.rowValue} title={gradeLabel} />
                <CustomButton title="Edit" styles={editButtonStyles} onPress={onStartEditGrade} />
              </View>
            </View>
          </View>

          {/* Learning Preferences Section */}
          <View style={styles.sectionContainer}>
            <CustomTextField styles={styles.sectionTitle} title="Your Learning Journey" />
            <CustomCheckboxList<MathTopic>
              options={topicOptions}
              selectedValues={selectedTopics}
              onChange={onToggleTopics}
              customCheckBoxStyles={checkboxStyles}
            />
          </View>

          {/* Settings Section */}
          <View style={styles.sectionContainer}>
            <CustomTextField styles={styles.sectionTitle} title="Settings" />
            <View style={styles.editableRow}>
              <CustomTextField styles={styles.rowLabel} title="Notifications" />
              <CustomSwitch
                value={notificationsEnabled}
                onValueChange={onToggleNotifications}
                styles={switchStyles}
              />
            </View>
          </View>

          {/* Data Section */}
          <View style={styles.sectionContainer}>
            <CustomTextField styles={styles.sectionTitle} title="Your Data" />
            <Pressable style={styles.linkRow} onPress={onNavigateToChatHistory}>
              <View style={styles.linkRowContent}>
                <CustomTextField styles={styles.linkRowText} title="My Chat History" />
              </View>
              <View style={styles.linkRowIcon}>
                <Feather name="chevron-right" size={20} color={colors.tertiaryForeground} />
              </View>
            </Pressable>
          </View>

          {/* Parent/Guardian Section */}
          <View style={styles.sectionContainer}>
            <CustomTextField styles={styles.sectionTitle} title="For Parents" />
            <CustomButton title="Share Progress Report" styles={shareButtonStyles} onPress={onShareProgress} />
          </View>

          <View style={styles.divider} />

          {/* Account Section */}
          <View style={styles.sectionContainer}>
            <CustomTextField styles={styles.sectionTitle} title="Account" />
            <View style={styles.buttonContainer}>
              <CustomButton title={t('auth.signOut')} styles={signOutButtonStyles} onPress={handleSignOut} />
            </View>
          </View>

          {/* About Section */}
          <View style={styles.aboutContainer}>
            <CustomTextField styles={styles.aboutText} title={`${t('app.name')} v${appVersion}`} />
            <CustomTextField
              styles={styles.creditsText}
              title={"Made with ❤️ for students everywhere"}
            />
          </View>
        </ScrollView>

        {/* Edit Name Modal */}
        <Modal visible={isEditingName} transparent animationType="fade" onRequestClose={onCancelEditName}>
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContent}>
              <CustomTextField styles={styles.editModalTitle} title="Edit Display Name" />
              <CustomTextInput
                styles={nameInputStyles}
                placeholder="Enter your name"
                defaultValue={displayName}
                onChangeText={onChangeDisplayName}
                autoFocus
              />
              <View style={styles.editModalButtons}>
                <CustomButton title={t('common.cancel')} styles={modalSecondaryButtonStyles} onPress={onCancelEditName} />
                <CustomButton title="Save" styles={modalPrimaryButtonStyles} onPress={onSaveDisplayName} />
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Grade Modal */}
        <Modal visible={isEditingGrade} transparent animationType="fade" onRequestClose={onCancelEditGrade}>
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContent}>
              <CustomTextField styles={styles.editModalTitle} title="Select Grade Level" />
              <GradePicker styles={styles} selectedGrade={gradeLevel} onSelectGrade={onChangeGradeLevel} />
              <View style={styles.editModalButtons}>
                <CustomButton title={t('common.cancel')} styles={modalSecondaryButtonStyles} onPress={onCancelEditGrade} />
                <CustomButton title="Save" styles={modalPrimaryButtonStyles} onPress={onSaveGradeLevel} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </OptionalWrapper>
  );
}
