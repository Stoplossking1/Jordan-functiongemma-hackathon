import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { BannerBaseStyles, useBannerStyles } from './BannerStyles';

export interface BannerProps {
  title: string;
  buttonText: string;
  onButtonPress: () => void;
  customStyles?: Partial<BannerBaseStyles>;
}

export function Banner(props: BannerProps): ReactNode {
  const { styles } = useBannerStyles(props.customStyles);

  return (
    <View style={styles.banner}>
      <CustomTextField title={props.title} styles={styles.bannerText} />
      <CustomButton title={props.buttonText} styles={styles.button} onPress={props.onButtonPress} />
    </View>
  );
}
