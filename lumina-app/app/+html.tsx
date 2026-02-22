/**
 * AUTO-GENERATED - DO NOT MODIFY!
 * Any changes will be lost when the file is regenerated.
 */

import { type PropsWithChildren, type ReactNode } from 'react';
import { type UnknownOutputParams } from 'expo-router';

import { useNav } from '@/comp-lib/navigation/useNav';
import HtmlContainer from '@/app-pages/HtmlContainer';

export type HtmlUrlParams = UnknownOutputParams;

export interface HtmlProps extends PropsWithChildren {
  /**
   * The page's URL params. Includes path and query params.
   */
  urlParams: HtmlUrlParams;
  /**
   * Sets the navigation options using navigation.setOptions()
   * @param options The options to set
   * @returns void
   */
  setNavigationOptions: (options?: Record<string, any>) => void;
}

/**
 * HTML rendering support page
 */
export default function HtmlPage(props: HtmlProps): ReactNode {
  const { urlParams, setOptions } = useNav<HtmlUrlParams>({ auth: false });

  return <HtmlContainer children={props.children} urlParams={urlParams} setNavigationOptions={setOptions} />;
}
