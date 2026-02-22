import { type AwsAuthConfig } from '../_shared-client/AwsAuthConfig.ts';
import { type SupabaseConfig } from '../_shared-client/SupabaseConfig.ts';
import { toUrlStr } from '../_shared-client/generated-db-types.ts';
import {
  ENV_VAR_ELEVENLABS_API_KEY,
  ENV_VAR_FINNHUB_API_KEY,
  ENV_VAR_GEMINI_API_KEY,
  ENV_VAR_GOOGLE_CLOUD_PROJECT_ID,
  ENV_VAR_GOOGLE_VERTEX_API_KEY,
  ENV_VAR_GROK_API_KEY,
  ENV_VAR_MAPBOX_ACCESS_TOKEN,
  ENV_VAR_OPENAI_API_KEY,
  ENV_VAR_OPENWEATHER_API_KEY,
  ENV_VAR_RESEND_API_KEY,
} from './env-var-names.ts';

export interface SupabaseExtendedConfig extends SupabaseConfig {
  // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
  serviceRoleKey: string;
  dbUrl?: string;
}

export interface BackendConfig {
  supabase: SupabaseExtendedConfig;
  aws: Partial<AwsAuthConfig>;
  sesRegion?: string;
  waitlistInfoWebhookUrl?: string;
  resendApiKey?: string;
  openWeatherApiKey?: string;
  finnhubApiKey?: string;
  elevenLabsApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  grokApiKey?: string;
  googleVertexApiKey?: string;
  googleCloudProjectId?: string;
  mapboxAccessToken?: string;
}

// Supabase url can come from various environment variables depending on the deployment context. E.g. the cloud-env declares it as `SUPABASE_WOZ_URL`.
const supabaseUrlStr =
  Deno.env.get('LOCALDEV_URL') ??
  Deno.env.get('SUPABASE_URL') ??
  Deno.env.get('EXPO_PUBLIC_SUPABASE_URL') ??
  Deno.env.get('SUPABASE_WOZ_URL');
const supabaseUrl = supabaseUrlStr != null ? toUrlStr(supabaseUrlStr) : undefined;
// Supabase anon key can come from various environment variables depending on the deployment context. E.g. the cloud-env declares it as `SUPABASE_AUTH_TOKEN`.
const supabaseAnonKey =
  Deno.env.get('LOCALDEV_ANON_KEY') ??
  Deno.env.get('SUPABASE_ANON_KEY') ??
  Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY') ??
  Deno.env.get('SUPABASE_AUTH_TOKEN');
const supabaseServiceRoleKey = Deno.env.get('LOCALDEV_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// consider aws config optional, but it can be retrieved validated through getValidAwsAuthConfig if an App requires it
const awsAccessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
const awsSecretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
const awsRegion = Deno.env.get('AWS_REGION');
const awsSesRegion = Deno.env.get('AWS_SES_REGION');

// Optional webhook URL for sending customer waitlist info
const waitlistInfoWebhookUrl = Deno.env.get('WAITLIST_INFO_WEBHOOK_URL');

const resendApiKey = Deno.env.get(ENV_VAR_RESEND_API_KEY);

const openWeatherApiKey = Deno.env.get(ENV_VAR_OPENWEATHER_API_KEY);
const finnhubApiKey = Deno.env.get(ENV_VAR_FINNHUB_API_KEY);
const elevenLabsApiKey = Deno.env.get(ENV_VAR_ELEVENLABS_API_KEY);
const openaiApiKey = Deno.env.get(ENV_VAR_OPENAI_API_KEY);
const geminiApiKey = Deno.env.get(ENV_VAR_GEMINI_API_KEY);
const grokApiKey = Deno.env.get(ENV_VAR_GROK_API_KEY);
const googleVertexApiKey = Deno.env.get(ENV_VAR_GOOGLE_VERTEX_API_KEY);
const googleCloudProjectId = Deno.env.get(ENV_VAR_GOOGLE_CLOUD_PROJECT_ID);
const mapboxAccessToken = Deno.env.get(ENV_VAR_MAPBOX_ACCESS_TOKEN);

if (!supabaseUrl) throw new Error('supabaseUrl is required');
if (!supabaseAnonKey) throw new Error('supabaseAnonKey is required');
if (!supabaseServiceRoleKey) throw new Error('supabaseServiceRoleKey is required.');

export const config: BackendConfig = {
  supabase: {
    // bucket: Deno.env.get('SUPABASE_AVATAR_BUCKET'),
    // Supabase API URL - env var exported by default when deployed.
    // https://supabase.com/docs/guides/functions/secrets#default-secrets
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
    serviceRoleKey: supabaseServiceRoleKey,
    dbUrl: Deno.env.get('SUPABASE_DB_URL'),
  },
  aws: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion,
  },
  sesRegion: awsSesRegion,
  waitlistInfoWebhookUrl,
  resendApiKey,
  openWeatherApiKey,
  finnhubApiKey,
  elevenLabsApiKey,
  openaiApiKey,
  geminiApiKey,
  grokApiKey,
  googleVertexApiKey,
  googleCloudProjectId,
  mapboxAccessToken,
};

export function getValidAwsAuthConfig(): AwsAuthConfig {
  if (!awsAccessKeyId) throw new Error('awsAccessKeyId is required');
  if (!awsSecretAccessKey) throw new Error('awsSecretAccessKey is required');
  if (!awsRegion) throw new Error('awsRegion is required.');
  return {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion,
  };
}

export function getValidAwsSesAuthConfig(): AwsAuthConfig {
  if (!awsAccessKeyId) throw new Error('awsAccessKeyId is required');
  if (!awsSecretAccessKey) throw new Error('awsSecretAccessKey is required');
  const region = awsSesRegion ?? awsRegion;
  if (!region) throw new Error('awsRegion or sesRegion is required.');

  return {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: region,
  };
}
