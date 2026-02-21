import type { CustomCameraFunc } from '@/comp-lib/custom-camera/CustomCameraFunc';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { type ReactNode, forwardRef } from 'react';
import { Pressable, View } from 'react-native';
import { CustomButton } from '../core/custom-button/CustomButton';
import { CustomTextField } from '../core/custom-text-field/CustomTextField';
import { useCustomCameraStyles } from './CustomCameraStyles';
import { t } from '@/i18n';

// Note: we need to remove 'ref' here since we are using `forwardRef` as the return value of CustomCamera
// https://react.dev/reference/react/forwardRef#forwardref
// This is required by React 18 and can be simplified when we use React 19
interface CustomCameraProps extends Omit<CustomCameraFunc, 'ref'> {
  onCancel: () => void;
}

/**
 * A custom component that simplifies use of the ReactNative CameraView and provides additonal functionality and customization
 *
 * Note: we need to supply 'ref' here since we are using `forwardRef` as the return value
 * https://react.dev/reference/react/forwardRef#forwardref
 * This is required by React 18 and can be simplified when we use React 19
 */
function CustomCamera(props: CustomCameraProps, ref: React.ForwardedRef<CameraView>): ReactNode {
  const { styles, permissionButtonStyles } = useCustomCameraStyles();
  if (!props.permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!props.permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <CustomTextField title={t('camera.permission')} styles={styles.message}></CustomTextField>
        <CustomButton title="Grant permission" onPress={props.onRequestPermission} styles={permissionButtonStyles} />
      </View>
    );
  }
  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={styles.camera}
        ref={ref}
        mode={props.mode}
        facing={props.type}
        mute={false}
        ratio={props.cameraRatio}
        responsiveOrientationWhenOrientationLocked
      >
        <Pressable onPress={props.onCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.shutterContainer}>
          <Pressable onPress={props.onPressShutterButton}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: props.mode === 'picture' ? 'white' : 'red',
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const Camera = forwardRef<CameraView, CustomCameraProps>(CustomCamera);
export default Camera;
