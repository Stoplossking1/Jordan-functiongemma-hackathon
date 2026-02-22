export class InterruptAccountDeletionError extends Error {
  readonly errorCode: number;

  constructor(message: string, errorCode: number) {
    super(message);

    this.errorCode = errorCode;
  }
}

export const ACCOUNT_DELETION_SUBSCRIPTION_CANCELLATION_FAILED_ERROR_CODE = 10001;
