import { getFiberFromHostInstance, getFiberStack, type Fiber } from 'bippy';

import type { ReactElementData, ReactElementStackItem } from '@shared/inspector/element-inspector-types.js';

export const REACT_ELEMENT_DATA_KEY = 'woz-comp';

export async function getReactData(element: Element): Promise<ReactElementData | undefined> {
  const fiber = getFiberFromHostInstance(element);
  if (!fiber) {
    return undefined;
  }

  const rawStack = getFiberStack(fiber);
  const enrichedStack: ReactElementStackItem[] = rawStack.filter(filterAppComponent).map(buildStackElementFromFiber);

  return {
    stack: enrichedStack,
  };
}

export function filterAppComponent(fiber: Fiber): boolean {
  const memoizedProps = fiber.memoizedProps ?? {};
  return memoizedProps[REACT_ELEMENT_DATA_KEY] !== undefined;
}

export function buildStackElementFromFiber(fiber: Fiber): ReactElementStackItem {
  return {
    componentName: fiber.type?.name ?? 'Unknown',
    source: fiber.memoizedProps?.[REACT_ELEMENT_DATA_KEY] as string,
  };
}
