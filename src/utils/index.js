// Custom API Error class
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// API Response wrapper class
export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.timestamp = new Date();
  }
}

export const asyncHandler = (fn) => {
  return (req,res,next)=> {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const calculatePagination = (options) => {
  const { page, limit, totalItems } = options;
  const totalPages = Math.ceil(totalItems / limit);
  const skip = (page - 1) * limit;
  
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    skip
  };
};

export const buildSearchQuery = (searchTerm, fields) => {
  if (!searchTerm) return {};
  
  return {
    $or: fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};

// Validation utility
export const parseQueryParams = (query) => {
  return {
    page: parseInt(query.page) || 1,
    limit: Math.min(parseInt(query.limit) || 20, 100), // Max 100 items per page
    search: query.search?.trim() || undefined
  };
};

// MongoDB ObjectId validation
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Response helpers
export const sendSuccessResponse = (
  res, data, message = 'Success', statusCode = 200
) => {
  res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

export const sendErrorResponse = (
  res, error, statusCode
) => {
  const code = statusCode || (error instanceof ApiError ? error.statusCode : 500);
  const message = error.message || 'Internal Server Error';
  
  res.status(code).json(new ApiResponse(code, null, message));
};

// Common HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// Common error messages
export const ERROR_MESSAGES = {
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  VALIDATION_ERROR: 'Validation error',
  DUPLICATE_RESOURCE: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error'
};

// ResponseUtil class for consistent API responses
export class ResponseUtil {
  static success(
    res,
    message = 'Success',
    data,
    statusCode = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(
    res,
    message = 'Error occurred',
    statusCode = 400,
    errors
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  static paginated (
    res,
    result,
    message = 'Data retrieved successfully'
  ) {
    return res.status(200).json({
      success: true,
      message,
      data: result
    });
  }

  static created(
    res,
    data,
    message = 'Created successfully'
  ) {
    return this.success(res, message, data, 201);
  }

  static noContent(
    res,
    message = 'Operation completed successfully'
  ) {
    return res.status(204).json({
      success: true,
      message
    });
  }

  static unauthorized(
    res,
    message = 'Unauthorized access'
  ) {
    return this.error(res, message, 401);
  }

  static forbidden(
    res,
    message = 'Access forbidden'
  ) {
    return this.error(res, message, 403);
  }

  static notFound(
    res,
    message = 'Resource not found'
  ) {
    return this.error(res, message, 404);
  }

  static validationError(
    res,
    errors,
    message = 'Validation failed'
  ) {
    return this.error(res, message, 422, errors);
  }

  static serverError(
    res,
    message = 'Internal server error'
  ) {
    return this.error(res, message, 500);
  }
}