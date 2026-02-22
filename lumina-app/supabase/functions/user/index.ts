import { type JwtPayload, type SupabaseClient } from '@supabase/supabase-js';

import { InterruptAccountDeletionError } from '../_shared-client/error/InterruptAccountDeletionError.ts';
import { type Database, toUuidStr } from '../_shared-client/generated-db-types.ts';
import { adminDeleteUserRelatedAssets, adminDeleteUserRelatedData } from '../_shared-client/user-db.ts';
import { USER_EDGE_FUNCTION_PATH, UserEdgeActions } from '../_shared-client/user-func-config.ts';
import { okResponse, parseURL, serveFunction, statusResponse } from '../_shared/server/func-server.ts';
import { supabaseAdminClient } from '../_shared/supabaseAdmin.ts';
import { makeClient } from '../_shared/supabaseClient.ts';
import { customDeleteUserFailureHandler } from './app/custom-delete-user-failure-handler.ts';
import { customDeleteUserHandler } from './app/custom-delete-user-handler.ts';
import { customDeleteUserSuccessHandler } from './app/custom-delete-user-success-handler.ts';
import { adminDeleteUserById } from './user-func.ts';

export function handler(
  supabaseClient: SupabaseClient<Database>,
  supabaseAdminClient: SupabaseClient<Database>,
): (req: Request) => Promise<Response> {
  return async function requestHandler(req: Request): Promise<Response> {
    const [func, action, _id] = parseURL(req.url);

    if (func !== USER_EDGE_FUNCTION_PATH) {
      return statusResponse(400, `Invalid function name: ${func}`);
    }

    switch (action) {
      case UserEdgeActions.DELETE_USER: {
        if (req.method !== 'POST') {
          return statusResponse(405, 'Method Not Allowed');
        }
        // Get the authenticated user id
        const { data: userData } = await supabaseClient.auth.getUser();
        const user = userData?.user ?? undefined;
        if (!user?.id) {
          console.warn('No authenticated user found');
          return statusResponse(401, 'Unauthorized: No authenticated user found');
        }
        const userId = toUuidStr(user.id);

        const errorMessages: string[] = [];
        const successMessages: string[] = [];

        // Delete user related assets
        const assetErr = await adminDeleteUserRelatedAssets(supabaseAdminClient, userId);
        if (assetErr) {
          console.error('Error deleting user assets:', assetErr);
          const assetErrMessage = assetErr instanceof Error ? assetErr.message : 'Unknown error';
          errorMessages.push(assetErrMessage);
        } else {
          successMessages.push('user related assets deleted');
        }

        // Custom app specific user deletion handler before user related data deletion
        try {
          await customDeleteUserHandler(supabaseAdminClient, user);
          successMessages.push('app specific data deleted');
        } catch (err) {
          if (err instanceof InterruptAccountDeletionError) {
            console.error('User deletion interrupted by custom handler:', err);
            return statusResponse(400, { success: false, error: { message: err.message, errorCode: err.errorCode } });
          }

          const customErrMessage = err instanceof Error ? err.message : 'Unknown error';
          errorMessages.push(customErrMessage);
        }

        // Delete user related data
        const linkErr = await adminDeleteUserRelatedData(supabaseAdminClient, userId);
        if (linkErr) {
          console.error('Error deleting user linked data:', linkErr);
          const linkErrMessage = linkErr instanceof Error ? linkErr.message : 'Unknown error';
          errorMessages.push(linkErrMessage);
        } else {
          successMessages.push('common user related data deleted');
        }

        let combinedMessages = errorMessages.length ? errorMessages.join('\n') : undefined;

        // Delete user
        const deleteErr = await adminDeleteUserById(supabaseAdminClient, user.id);
        if (deleteErr) {
          console.error('Error deleting user:', deleteErr);
          const deleteErrMessage = deleteErr instanceof Error ? deleteErr.message : 'Unknown error';
          combinedMessages = combinedMessages ?? '' + `\n${deleteErrMessage}`;
          if (successMessages.length) {
            const successInfo = successMessages.join('\n');
            combinedMessages += `\n\nSuccesfull operations: ${successInfo}`;
          }
          await customDeleteUserFailureHandler(supabaseAdminClient, user, combinedMessages);

          return statusResponse(500, `Internal server error: ${deleteErrMessage}`);
        }

        await customDeleteUserSuccessHandler(supabaseAdminClient, user, combinedMessages);

        return okResponse({ success: true });
      }
      default:
        break;
    }
    return statusResponse(404, `unknown action: ${action}`);
  };
}

serveFunction(true, (req: Request, _claims?: JwtPayload): Promise<Response> => {
  // Setup dependencies
  const supabaseClient = makeClient(req.headers);

  // Inject dependencies into the handler and call it with the request object
  return handler(supabaseClient, supabaseAdminClient)(req);
});
