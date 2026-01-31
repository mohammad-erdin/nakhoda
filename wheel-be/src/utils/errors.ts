export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, code = 'NOT_FOUND') {
    super(`${resource} not found`, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(message, 500, code);
  }
}

export class RudderNotFoundError extends NotFoundError {
  constructor(rudderId: string) {
    super(`Rudder ${rudderId}`, 'RUDDER_NOT_FOUND');
  }
}

export class ContainerNotFoundError extends NotFoundError {
  constructor(containerId: string) {
    super(`Container ${containerId}`, 'CONTAINER_NOT_FOUND');
  }
}

export class ImageNotFoundError extends NotFoundError {
  constructor(imageId: string) {
    super(`Image ${imageId}`, 'IMAGE_NOT_FOUND');
  }
}

export class VolumeNotFoundError extends NotFoundError {
  constructor(volumeId: string) {
    super(`Volume ${volumeId}`, 'VOLUME_NOT_FOUND');
  }
}

export class JobNotFoundError extends NotFoundError {
  constructor(jobId: string) {
    super(`Job ${jobId}`, 'JOB_NOT_FOUND');
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('Invalid or expired token', 'INVALID_TOKEN');
  }
}

export class RudderOfflineError extends ConflictError {
  constructor(rudderId: string) {
    super(`Rudder ${rudderId} is offline`, 'RUDDER_OFFLINE');
  }
}
