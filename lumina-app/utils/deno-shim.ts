// make sure to import this file before accessing any deno function

(global as any).Deno = {
  env: {
    get: (key: string) => process.env[key],
  },
  serve: () => {
    throw new Error('Deno.serve not implemented');
  },
  test: () => {
    throw new Error('Deno.test not implemented');
  },
  // this is needed for prettier
  args: [...process.argv],
  // Add other required Deno properties/methods as needed
};
