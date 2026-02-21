// address environment variables from .env not loaded in jest

// IMPORT ORDER IS IMPORTANT
import './utils/dot-env.ts';
// IMPORT ORDER IS IMPORTANT
import './utils/deno-shim.ts';

// https://github.com/expo/expo/issues/25452
// https://github.com/expo/expo/issues/26513
// import { loadProjectEnv } from '@expo/env';
// loadProjectEnv(process.cwd(), { silent: false }); // Load expo environment variables
