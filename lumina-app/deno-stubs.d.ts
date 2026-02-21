// reversal to built-in NonNullable<T>, since it won't be added by Typescript
// see https://github.com/microsoft/TypeScript/issues/39522
//type Nullable<T> = T | null | undefined;

// type copied from lib.deno.ns.d.ts to allow node test compilation to work
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export function serve(handler: ServeHandler<Deno.NetAddr>): HttpServer<Deno.NetAddr>;
  export const env: Env;
  export const test: DenoTest;
}

// type copied from lib.deno.url.d.ts to allow node test compilation to work

interface URLPatternInit {
  protocol?: string;
  username?: string;
  password?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  baseURL?: string;
}

type URLPatternInput = string | URLPatternInit;

interface URLPatternComponentResult {
  input: string;
  groups: Record<string, string | undefined>;
}

interface URLPatternResult {
  inputs: [URLPatternInit] | [URLPatternInit, string];
  protocol: URLPatternComponentResult;
  username: URLPatternComponentResult;
  password: URLPatternComponentResult;
  hostname: URLPatternComponentResult;
  port: URLPatternComponentResult;
  pathname: URLPatternComponentResult;
  search: URLPatternComponentResult;
  hash: URLPatternComponentResult;
}

interface URLPatternOptions {
  ignoreCase: boolean;
}

interface URLPattern {
  test(input: URLPatternInput, baseURL?: string): boolean;
  exec(input: URLPatternInput, baseURL?: string): URLPatternResult | null;
  readonly protocol: string;
  readonly username: string;
  readonly password: string;
  readonly hostname: string;
  readonly port: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly hasRegExpGroups: boolean;
}

// eslint-disable-next-line no-var, @typescript-eslint/no-redeclare
declare var URLPattern: {
  readonly prototype: URLPattern;
  new (input: URLPatternInput, baseURL: string, options?: URLPatternOptions): URLPattern;
  new (input?: URLPatternInput, options?: URLPatternOptions): URLPattern;
};

// prevents the Typescript compiler from causing an error even if we only load this module in Deno
declare module 'jsr:@std/encoding/base64' {
  export function encodeBase64(data: Uint8Array): string;
  export function decodeBase64(str: string): Uint8Array;
}
