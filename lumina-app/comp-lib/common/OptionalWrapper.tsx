import React, { ReactNode } from 'react';

interface OptionalWrapperProps<T = any, U = ReactNode, P = {}> {
  enable?: boolean;
  style?: T;
  children?: U;
  Wrapper: React.ComponentType<{ children?: U; style?: T } & P>;
  wrapperProps?: P;
}

export default function OptionalWrapper(props: OptionalWrapperProps): ReactNode {
  if (props.enable) {
    return (
      <props.Wrapper style={props.style} {...props.wrapperProps}>
        {props.children}
      </props.Wrapper>
    );
  }

  return props.children;
}
