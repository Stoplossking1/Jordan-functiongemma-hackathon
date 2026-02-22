import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { UpdatePasswordCoreStyles } from '@/comp-lib/auth/UpdatePasswordCoreStyles';
import { useLoginStyles } from './LoginStyles';
import { spacingPresets } from '@/comp-lib/styles/Styles';

export interface UpdatePasswordStyles {
  updatePasswordStyles: UpdatePasswordCoreStyles;
}

export function useUpdatePasswordStyles(): UpdatePasswordStyles {
  const { createAppPageStyles, overrideStyles } = useStyleContext();

  // Inherit styles from the login page to ensure visual consistency between auth pages (Login, Signup, etc)
  const { sharedAuthStyles, sharedTextInputStyles, sharedPrimaryButtonStyles, sharedTertiaryButtonStyles } =
    useLoginStyles();

  const loginMatchedUpdatePasswordCoreStyles = {
    authBaseStyles: overrideStyles(sharedAuthStyles, {}),
    textInputStyles: overrideStyles(sharedTextInputStyles, {}),
    textInputStylesError: overrideStyles(sharedTextInputStyles, {
      container: {
        marginBottom: 0, // to place error text
      },
    }),
    error: {
      marginBottom: sharedTextInputStyles.container?.marginBottom ?? spacingPresets.md1,
    },
    primaryButtonStyles: overrideStyles(sharedPrimaryButtonStyles, {}),
    tertiaryButtonStyles: overrideStyles(sharedTertiaryButtonStyles, {}),
  };

  return createAppPageStyles<UpdatePasswordStyles>({ updatePasswordStyles: loginMatchedUpdatePasswordCoreStyles });
}
