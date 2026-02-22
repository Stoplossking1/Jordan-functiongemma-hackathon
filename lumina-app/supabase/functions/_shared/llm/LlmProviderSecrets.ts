//import { Deno } from '@deno/shim-deno';
import { type AwsAuthConfig } from '../../_shared-client/AwsAuthConfig.ts';
import { type GoogleAuthConfig } from '../../_shared-client/GoogleAuthConfig.ts';
export * from '../../_shared-client/AwsAuthConfig.ts';
export * from '../../_shared-client/GoogleAuthConfig.ts';

export interface LlmProviderSecrets {
  aws: Partial<AwsAuthConfig>;
  google: Partial<GoogleAuthConfig>;
  openaiApiKey?: string;
}

// support specifying an override for the aws specifically for bedrock, in case we need
// to run bedrock in a different region than the rest of AWS infrastructure, due to rate limits
export const providerSecrets: LlmProviderSecrets = {
  aws: {
    accessKeyId: Deno.env.get('BEDROCK_ACCESS_KEY_ID') ?? Deno.env.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('BEDROCK_SECRET_ACCESS_KEY') ?? Deno.env.get('AWS_SECRET_ACCESS_KEY'),
    region: Deno.env.get('BEDROCK_REGION') ?? Deno.env.get('AWS_REGION'),
  },
  google: {
    // fixed value for now
    type: 'service_account',
    // use vertex ai specfic env variables with generic fallback
    clientEmail: Deno.env.get('VAI_SERVICE_ACCOUNT') ?? Deno.env.get('GCP_SERVICE_ACCOUNT'),
    privateKey: Deno.env.get('VAI_SERVICE_ACCOUNT_SECRET') ?? Deno.env.get('GCP_SERVICE_ACCOUNT_SECRET'),
    projectId: Deno.env.get('VAI_PROJECT_ID') ?? Deno.env.get('GCP_PROJECT_ID'),
    location: Deno.env.get('VAI_REGION') ?? Deno.env.get('GCP_REGION'),
  },
  openaiApiKey: Deno.env.get('OPENAI_API_KEY'),
};
