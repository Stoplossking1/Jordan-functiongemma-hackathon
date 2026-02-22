import { type ReactNode, type ComponentProps } from 'react';
import { Platform } from 'react-native';
import { Link } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';

// interface Props extends Omit<ComponentProps<typeof Link>, 'href'> {
//   href: Href;
// }

export function ExternalLink(props: ComponentProps<typeof Link>): ReactNode {
  const { href, ...rest } = props; // destructure needed to get remaining content into "rest"
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={(event) => {
        if (Platform.OS !== 'web') {
          const hrefLink = typeof href === 'string' ? href : href.pathname;
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          openBrowserAsync(hrefLink).catch((error) => {
            console.error('openBrowserAsync error:', error);
          });
        }
      }}
    />
  );
}
