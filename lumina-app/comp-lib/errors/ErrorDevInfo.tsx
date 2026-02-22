import React, { type ReactNode } from 'react';
import { View, ScrollView } from 'react-native';

import { t } from '@/i18n';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';

import { useErrorModalStyles } from './ErrorModalStyles.ts';
import { useErrorModal } from './ErrorModalFunc.ts';

interface ErrorDevInfoProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  onHideInfo: () => void;
}

export function ErrorDevInfo(props: ErrorDevInfoProps): ReactNode {
  const { styles, moreInfoButtonStyle } = useErrorModalStyles();
  const {
    formatCause,
    componentStackLines,
    parsedSources,
    sourcesExpanded,
    componentStackExpanded,
    toggleSourcesExpanded,
    toggleComponentStackExpanded,
  } = useErrorModal(props);

  return (
    <ScrollView style={styles.devContainer}>
      <CustomButton title={t('errors.hideInfo')} styles={moreInfoButtonStyle} onPress={props.onHideInfo} />
      <CustomTextField title={t('errors.error')} styles={styles.devTitle} />

      {!!props.error?.message && <CustomTextField title={props.error.message} styles={styles.devErrorText} />}

      {!!props.error?.name && (
        <CustomTextField title={`${t('errors.name')}: ${props.error.name}`} styles={styles.devText} />
      )}

      {!!props.errorInfo?.digest && (
        <CustomTextField title={`${t('errors.digest')}: ${props.errorInfo.digest}`} styles={styles.devText} />
      )}

      <View style={styles.sectionHeader}>
        <CustomTextField title={t('errors.sources')} styles={styles.sectionHeaderText} />
        <CustomButton
          title={sourcesExpanded ? t('errors.minimize') : t('errors.expand')}
          styles={moreInfoButtonStyle}
          onPress={toggleSourcesExpanded}
        />
      </View>
      <View style={styles.codeBlock}>
        {(sourcesExpanded ? parsedSources : parsedSources.slice(0, 3)).map((line, idx) => (
          <CustomTextField key={`src-${idx}`} title={line} styles={styles.codeLine} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <CustomTextField title={t('errors.componentStack')} styles={styles.sectionHeaderText} />
        <CustomButton
          title={componentStackExpanded ? t('errors.minimize') : t('errors.expand')}
          styles={moreInfoButtonStyle}
          onPress={toggleComponentStackExpanded}
        />
      </View>
      <View style={styles.codeBlock}>
        {(componentStackExpanded ? componentStackLines : componentStackLines.slice(0, 4)).map((line, idx) => (
          <CustomTextField key={`cmp-${idx}`} title={line} styles={styles.codeLine} />
        ))}
      </View>
      {!!props.error?.cause && (
        <CustomTextField title={`${t('errors.cause')}: ${formatCause(props.error.cause)}`} styles={styles.devText} />
      )}
    </ScrollView>
  );
}
