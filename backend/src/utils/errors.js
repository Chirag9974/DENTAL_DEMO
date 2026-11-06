/** Operational error with an HTTP status. Throw these from services/controllers. */
export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
  }

  static badRequest(msg = 'Invalid request', details) {
    return new AppError(400, msg, details);
  }
  static unauthorized(msg = 'Authentication required') {
    return new AppError(401, msg);
  }
  static forbidden(msg = 'Not allowed') {
    return new AppError(403, msg);
  }
  static notFound(msg = 'Not found') {
    return new AppError(404, msg);
  }
  static conflict(msg = 'Conflict') {
    return new AppError(409, msg);
  }
}
