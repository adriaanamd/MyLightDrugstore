export class TransportRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message)
    this.name = "TransportRequestError"
  }
}
