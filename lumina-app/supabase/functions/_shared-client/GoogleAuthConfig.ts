// Enable key for service accounts:
//   https://www.reddit.com/r/googleworkspace/comments/1biw03d/service_account_key_creation_is_disabled/
// go to: https://console.cloud.google.com/iam-admin/iam
//     -> select whole organization, not just project
//     -> edit your user and add roles: "Organization Administrator", "Organization Policy Administrator"
// go to: https://console.cloud.google.com/iam-admin/orgpolicies/list
// search for: "Disable service account key creation"
// then make a service account:
// go to: https://console.cloud.google.com/iam-admin/serviceaccounts
//
// enable vertex ai:
// go to: https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=woz-builder
// {"code":403,"message":"Vertex AI API has not been used in project woz-builder before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/aiplatform.googleapis.com/overview?project=woz-builder then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.","status":"PERMISSION_DENIED","details":[{"@type":"type.googleapis.com/google.rpc.ErrorInfo","reason":"SERVICE_DISABLED"

// https://cloud.google.com/docs/authentication/api-keys
// https://cloud.google.com/resources/cloud-express-faqs?hl=en
// https://console.cloud.google.com/apis/credentials

export interface GoogleAuthConfig {
  // only supporting service accounts for now
  type: 'service_account';
  // service account email. The "client_email" content from the service account json key file
  clientEmail: string;
  // "private_key" content from the service account json key file
  privateKey: string;
  // The Google Cloud project ID. It is not the numeric project name.
  projectId: string;
  // The Google Cloud project location. If no location resolved from runtime environment,
  // SDK will use default value `us-central1`
  location?: string;
}

export function isCompleteGoogleAuthConfig(config: Partial<GoogleAuthConfig>): config is GoogleAuthConfig {
  return config.type != null && config.clientEmail != null && config.privateKey != null && config.projectId != null;
}
