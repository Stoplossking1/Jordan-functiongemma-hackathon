export class CanceledError extends Error {
  // when expose == true, then the message will be used as the payload for http responses
  constructor(
    message: string,
    public override cause?: any,
    public expose = true,
  ) {
    super(message);
    //Error.captureStackTrace(this, CanceledError);
  }
}
