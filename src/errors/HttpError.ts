export class HttpError extends Error {
  public status: number;

  constructor(status: number, message?: string) {
    super(message);
    this.status = status;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}
