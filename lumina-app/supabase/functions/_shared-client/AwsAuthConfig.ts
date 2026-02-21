export interface AwsAuthConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export function isCompleteAwsAuthConfig(config: Partial<AwsAuthConfig>): config is AwsAuthConfig {
  return config.accessKeyId != null && config.secretAccessKey != null && config.region != null;
}
