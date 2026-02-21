/**
 * Business logic for the Profile route
 */
import { useState, useEffect } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import { ProfileProps } from '@/app/onboarding/profile';
import { buildInitialFormState, validateControl } from '@/comp-lib/form/utils';
import { FormControlValue, type FormControlConfig } from '@/comp-lib/form/FormControl';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { GradeButtonStylesType } from './ProfileStyles';
import { type GradeLevel } from '@shared/generated-db-types';
import { upsertLuminaProfile } from '@shared/lumina-db';
import { updateProfile } from '@shared/profile-db';

// Re-export for consumers that were importing from this file
export type { GradeLevel };

export interface GradeOption {
  value: GradeLevel;
  label: string;
}

export const GRADE_OPTIONS: GradeOption[] = [
  { value: 'GRADE_6' as GradeLevel, label: 'Grade 6' },
  { value: 'GRADE_7' as GradeLevel, label: 'Grade 7' },
  { value: 'GRADE_8' as GradeLevel, label: 'Grade 8' },
  { value: 'GRADE_9' as GradeLevel, label: 'Grade 9' },
];

const controls: FormControlConfig[] = [
  {
    data: '/User/givenName',
    type: 'textInput',
    placeholder: 'What should I call you?',
    description: 'Display name or nickname the user wants to be called by the tutor',
    required: true,
    defaultValue: '',
    minLength: 1,
    maxLength: 30,
    dataType: 'string',
  },
];

const currentStep = 1;
const totalSteps = 2;

/**
 * Interface for the return value of the useProfile hook
 */
export interface ProfileFunc {
  /**
   * Loading state for async operations
   */
  isLoading: boolean;

  /**
   * Saving state for database operations
   */
  isSaving: boolean;

  /**
   * Error state for async operations
   */
  error?: Error;
  controls: FormControlConfig[];
  currentStep: number;
  totalSteps: number;
  formState: Record<string, FormControlValue | undefined>;
  formErrors: Record<string, string>;
  gradeOptions: GradeOption[];
  selectedGrade: GradeLevel | undefined;
  greetingPreview: string;
  nameError: string;
  gradeError: string;

  /**
   * Function to handle value changes in form controls
   * @param dataPath - The path to the data being changed
   * @param value - The new value for the control
   */
  handleValueChange: (dataPath: string, value?: FormControlValue) => void;
  onSelectGrade: (grade: GradeLevel) => void;
  onHandleSubmit: () => void;
  getGradeButtonStyle: (gradeValue: GradeLevel, gradeButtonStyles: GradeButtonStylesType) => CustomButtonStyles;
}

/**
 * Custom hook that provides business logic for the Profile component
 */
export function useProfile(props: ProfileProps): ProfileFunc {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [formState, setFormState] = useState<Record<string, FormControlValue | undefined>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | undefined>(undefined);
  const [gradeError, setGradeError] = useState<string>('');

  useEffect(() => {
    const initialState: Record<string, FormControlValue | undefined> = buildInitialFormState(controls);
    setFormState(initialState);
  }, []);

  const userName = (formState['/User/givenName'] as string) ?? '';
  const greetingPreview = userName.trim() 
    ? `Great job, ${userName.trim()}! You're doing amazing!` 
    : '';
  const nameError = formErrors['/User/givenName'] ?? '';

  function handleValueChange(dataPath: string, value?: FormControlValue) {
    setFormState((prev) => ({ ...prev, [dataPath]: value }));
    setFormErrors((prev) => ({ ...prev, [dataPath]: '' }));
  }

  function onSelectGrade(grade: GradeLevel): void {
    setSelectedGrade(grade);
    setGradeError('');
  }

  function getGradeButtonStyle(gradeValue: GradeLevel, gradeButtonStyles: GradeButtonStylesType): CustomButtonStyles {
    return selectedGrade === gradeValue ? gradeButtonStyles.selected : gradeButtonStyles.default;
  }

  async function saveProfileDataAsync(givenName: string, gradeLevel: GradeLevel): Promise<void> {
    setIsSaving(true);
    setError(undefined);
    
    try {
      // Save given name to base profile using updateProfile for givenName field
      await updateProfile(supabaseClient, { givenName });
      
      // Save grade level to lumina profile (onboarding not yet complete)
      await upsertLuminaProfile(supabaseClient, gradeLevel, false);
      
      // Navigate to preferences page after successful save
      props.onNavigateNextPage?.();
    } catch (err) {
      console.error('Failed to save profile data:', err);
      setError(err instanceof Error ? err : new Error('Failed to save profile data'));
    } finally {
      setIsSaving(false);
    }
  }

  function onHandleSubmit(): void {
    const newErrors: Record<string, string> = {};
    let hasGradeError = false;

    for (const control of controls) {
      const value = formState[control.data];
      const validationError = validateControl(control, value);
      if (validationError) {
        newErrors[control.data] = validationError;
      }
    }

    if (!selectedGrade) {
      hasGradeError = true;
      setGradeError('Please select your grade');
    }

    if (Object.keys(newErrors).length > 0 || hasGradeError) {
      setFormErrors(newErrors);
      return;
    }

    // TypeScript narrowing: selectedGrade is guaranteed to be defined after validation above
    if (!selectedGrade) {
      return;
    }

    const givenName = (formState['/User/givenName'] as string).trim();
    
    // Save data to database and navigate on success
    saveProfileDataAsync(givenName, selectedGrade).catch((err) => {
      console.error('onHandleSubmit error:', err);
    });
  }

  return {
    isLoading,
    isSaving,
    error,
    controls,
    currentStep,
    totalSteps,
    formState,
    formErrors,
    gradeOptions: GRADE_OPTIONS,
    selectedGrade,
    greetingPreview,
    nameError,
    gradeError,
    handleValueChange,
    onSelectGrade,
    onHandleSubmit,
    getGradeButtonStyle,
  };
}
