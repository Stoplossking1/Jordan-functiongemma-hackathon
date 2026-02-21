interface Base64Utils {
  encodeBase64: (data: Uint8Array) => string;
  decodeBase64: (base64String: string) => Uint8Array;
}

// Check if we're actually running in Deno (not just with the shim)
const isRealDeno = typeof Deno !== 'undefined' && 'version' in Deno;

const base64Utils: Base64Utils = isRealDeno
  ? {
      // Synchronous stubs that will be replaced after async import
      encodeBase64: () => {
        throw new Error('Base64 utils not initialized');
      },
      decodeBase64: () => {
        throw new Error('Base64 utils not initialized');
      },
    }
  : {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore This code is only needed in Node.js environments
      // deno-lint-ignore no-node-globals
      encodeBase64: (data: Uint8Array) => Buffer.from(data).toString('base64'),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore This code is only needed in Node.js environments
      // deno-lint-ignore no-node-globals
      decodeBase64: (str: string) => new Uint8Array(Buffer.from(str, 'base64')),
    };

if (isRealDeno) {
  // Initialize Deno utils if needed.
  // Since the import cannot be done on the top-level due to module restrictions we need to load this async
  // eslint-disable-next-line import/no-unresolved, @typescript-eslint/no-floating-promises
  import('jsr:@std/encoding/base64').then((module) => {
    base64Utils.encodeBase64 = module.encodeBase64;
    base64Utils.decodeBase64 = module.decodeBase64;
  });
}

export const decodeBase64 = (base64String: string): Uint8Array => base64Utils.decodeBase64(base64String);
export const encodeBase64 = (uint8Array: Uint8Array): string => base64Utils.encodeBase64(uint8Array);
