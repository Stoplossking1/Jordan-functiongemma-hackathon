import { useEffect, useRef, useState } from 'react';
import { Platform, Settings as SettingsIosOnly } from 'react-native';
import {
  router,
  useLocalSearchParams,
  useGlobalSearchParams,
  useNavigation,
  type HrefInputParams,
  type UnknownOutputParams,
  type Route,
  type RouteInputParams,
  usePathname,
} from 'expo-router';
import { useAppSetup } from '@/comp-lib/common/useAppSetup';

type NavHookProps = {
  auth?: boolean;
};

type NavFunc<T extends UnknownOutputParams = UnknownOutputParams> = {
  /**
   * Navigates to the specified path with strongly-typed route parameters
   */
  navigate: (href: HrefInputParams) => void;

  /**
   * Goes back one page in the navigation stack
   */
  back: () => void;

  /**
   * Dismisses all pages in the modal stack
   */
  dismissAll: () => void;

  /**
   * Dismisses back to a specific route with strongly-typed route parameters
   */
  dismissTo: (href: HrefInputParams) => void;

  /**
   * Dismisses a specific number of pages from the stack
   */
  dismiss: (count: number) => void;

  /**
   * Pushes a new route onto the navigation stack with strongly-typed parameters
   */
  push: (href: HrefInputParams) => void;

  /**
   * Replaces the current page with the specified route
   */
  replace: (href: HrefInputParams) => void;

  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setOptions: (options?: Record<string, any>) => void;

  /**
   * Sets parameters for the current route
   */
  setUrlParams: (urlParams: RouteInputParams<Route>) => void;

  /**
   * The current route parameters
   */
  urlParams: T;
};

export function useNav<TParams extends UnknownOutputParams = UnknownOutputParams>(
  props: NavHookProps,
): NavFunc<TParams> {
  const { auth = false } = props;
  const navigation = useNavigation();
  const pathname = usePathname();
  const params = useLocalSearchParams<TParams>();
  const globalParams = useGlobalSearchParams();
  const { isAuthenticated, isLoading } = useAppSetup();
  const [isAuthIosEnabled, setIsAuthIosEnabled] = useState<boolean | undefined>(undefined);
  const pathnameRef = useRef(pathname);
  const globalParamsRef = useRef(globalParams);

  // Note: do not use `usePathname` or `useSegments` here - it creates global re-renders on route change

  useEffect(() => {
    if (Platform.OS === 'ios') {
      try {
        const authEnvTemp = SettingsIosOnly.get('AUTH_ENABLED');
        setIsAuthIosEnabled(authEnvTemp === 'true');
      } catch (error) {
        console.error('Error checking auth enabled:', error);
        setIsAuthIosEnabled(false);
      }
    }
  }, []);

  useEffect(() => {
    const isAuthCheckEnabled = Platform.OS === 'ios' ? isAuthIosEnabled : true;
    if (router && isAuthenticated === false && auth && isAuthCheckEnabled && !isLoading) {
      const currentPathname = pathnameRef.current;
      const currentGlobalParams = globalParamsRef.current as Record<string, string>;

      const query = new URLSearchParams(currentGlobalParams).toString();
      const redirect = query ? `${currentPathname}?${query}` : currentPathname;

      setTimeout(() => router.navigate({ pathname: '/auth/login', params: { redirect } }), 10);
    }
  }, [isAuthenticated, isLoading, auth, isAuthIosEnabled]);

  useEffect(() => {
    pathnameRef.current = pathname;
    globalParamsRef.current = globalParams;
  }, [pathname, globalParams]);

  /**
   * Type-safe navigation function with route-specific parameter types
   */
  const navigate = (href: HrefInputParams) => {
    router.push(href); // TODO: use push instead of navigate, navigate crashes the app and it's not really needed: https://stackoverflow.com/questions/78455696/app-crashes-using-stack-navigation-after-upgrading-from-sdk-49-to-51-in-react-na
  };

  const back = () => {
    router.back();
  };

  const dismissAll = () => {
    router.dismissAll();
  };

  const dismissTo = (href: HrefInputParams) => {
    router.dismissTo(href);
  };

  const dismiss = (count: number) => {
    router.dismiss(count);
  };

  const push = (href: HrefInputParams) => {
    router.push(href);
  };

  const replace = (href: HrefInputParams) => {
    router.replace(href);
  };

  const setUrlParams = (href: RouteInputParams<Route>) => {
    router.setParams(href);
  };

  /**
   * Sets the navigation options
   * @param options The options to set
   */
  const setOptions = (options?: Record<string, any>) => {
    if (!options) return;
    navigation.setOptions(options);
  };

  return {
    navigate,
    back,
    dismissAll,
    dismissTo,
    dismiss,
    push,
    replace,
    setOptions,
    setUrlParams,
    urlParams: params,
  };
}
