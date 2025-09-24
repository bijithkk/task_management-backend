import { ResponseUtil } from '../utils/index.js'; 
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    message,
    statusCode= 500,
    isOperational = true,
    errors
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMiddleware = (
  error,
  req,
  res,
  next
)=> {
  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let errors = error.errors;

  // Log error for debugging (you might want to use a proper logger)
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  switch (error.name) {
    case 'ValidationError':
      statusCode = 422;
      message = 'Validation failed';
      // Handle mongoose validation errors or similar
      if (error.errors) {
        errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
      }
      break;

    case 'CastError':
      statusCode = 400;
      message = 'Invalid data format';
      break;

    case 'JsonWebTokenError':
      statusCode = 401;
      message = 'Invalid token';
      break;

    case 'TokenExpiredError':
      statusCode = 401;
      message = 'Token expired';
      break;

    case 'MongoError':
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry found';
      }
      break;

    case 'MulterError':
      statusCode = 400;
      message = 'File upload error';
      break;

    case 'SyntaxError':
      statusCode = 400;
      message = 'Invalid JSON syntax';
      break;

    case 'TypeError':
      statusCode = 400;
      message = 'Invalid data type';
      break;

    case 'ReferenceError':
      statusCode = 500;
      message = 'Internal reference error';
      break;

    case 'RangeError':
      statusCode = 400;
      message = 'Value out of range';
      break;

    case 'URIError':
      statusCode = 400;
      message = 'Invalid URI';
      break;

    case 'EvalError':
      statusCode = 500;
      message = 'Evaluation error';
      break;

    case 'Error':
      // Handle generic errors with specific status codes
      if (statusCode === 429) {
        message = 'Too many requests. Please try again later.';
      } else if (statusCode === 413) {
        message = 'Payload too large';
      } else if (statusCode === 415) {
        message = 'Unsupported media type';
      } else if (statusCode === 429) {
        message = 'Rate limit exceeded';
      }
      break;

    case 'MongooseError':
      statusCode = 400;
      message = 'Database operation failed';
      break;

    case 'StrictModeError':
      statusCode = 400;
      message = 'Strict mode validation failed';
      break;

    case 'VersionError':
      statusCode = 409;
      message = 'Document version conflict';
      break;

    case 'OverwriteModelError':
      statusCode = 500;
      message = 'Model overwrite error';
      break;

    case 'MissingSchemaError':
      statusCode = 500;
      message = 'Schema not found';
      break;

    case 'DivergentArrayError':
      statusCode = 400;
      message = 'Array modification conflict';
      break;

    case 'ValidatorError':
      statusCode = 422;
      message = 'Data validation failed';
      if (error.errors) {
        errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
      }
      break;
  }

  // Handle specific error codes
  if (statusCode === 429) {
    message = 'Too many requests. Please try again later.';
  } else if (statusCode === 413) {
    message = 'Payload too large';
  } else if (statusCode === 415) {
    message = 'Unsupported media type';
  }

  // Handle MongoDB specific error codes
  if (error.code) {
    switch (error.code) {
      case 11000:
        statusCode = 409;
        message = 'Duplicate entry found';
        break;
      case 11001:
        statusCode = 409;
        message = 'Duplicate key error';
        break;
      case 121:
        statusCode = 400;
        message = 'Document validation failed';
        break;
      case 16755:
        statusCode = 400;
        message = 'Invalid BSON data';
        break;
    }
  }

  // Use ResponseUtil based on status code
  switch (statusCode) {
    case 400:
      ResponseUtil.error(res, message, statusCode, errors);
      break;
    case 401:
      ResponseUtil.unauthorized(res, message);
      break;
    case 403:
      ResponseUtil.forbidden(res, message);
      break;
    case 404:
      ResponseUtil.notFound(res, message);
      break;
    case 409:
      ResponseUtil.error(res, message, statusCode, errors);
      break;
    case 413:
      ResponseUtil.error(res, message, statusCode, errors);
      break;
    case 415:
      ResponseUtil.error(res, message, statusCode, errors);
      break;
    case 422:
      ResponseUtil.validationError(res, errors || [], message);
      break;
    case 429:
      ResponseUtil.error(res, message, statusCode, errors);
      break;
    case 500:
      ResponseUtil.serverError(res, message);
      break;
    default:
      ResponseUtil.error(res, message, statusCode, errors);
      break;
  }
};

// Not found middleware (should be placed after all routes)
export const notFoundMiddleware = (
  req,
  res,
  next
)=> {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
};

