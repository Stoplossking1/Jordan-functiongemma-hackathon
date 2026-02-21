export class EventStreamError extends Error {}

export class ApiStreamError<TError extends object | undefined = object | undefined> extends EventStreamError {
  /** JSON body of the response that caused the error */
  readonly error: TError;

  readonly code?: string | null;
  readonly param?: string | null;
  readonly type?: string;

  readonly requestId?: string | null;

  constructor(error: TError, message?: string) {
    super(`${ApiStreamError.makeMessage(error, message)}`);
    this.error = error;

    const data = error as Record<string, any>;
    this.code = data?.code;
    this.param = data?.param;
    this.type = data?.type;
  }

  private static makeMessage(error: any, message?: string): string {
    const msg = error?.message
      ? typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error.message)
      : error
        ? JSON.stringify(error)
        : message;

    if (msg) {
      return msg;
    }
    return '(no status code or body)';
  }

  //   static generate(errorResponse?: Object, message?: string): ApiStreamError {
  //     const error = (errorResponse as Record<string, any>)?.['error'];
  //     return new ApiStreamError(error, message);
  //   }
}
