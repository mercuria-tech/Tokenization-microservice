import { Env } from '../worker';

// Error response interface
interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

// Centralized error handler for Workers
export function errorHandler(error: any, request: Request, env: Env): Response {
  const timestamp = new Date().toISOString();
  const requestId = request.headers.get('CF-Ray') || 'unknown';
  
  let status = 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';

  // Handle different types of errors
  if (error instanceof Error) {
    errorMessage = error.message;
    
    // Map common errors to appropriate status codes
    if (error.message.includes('not found')) {
      status = 404;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      status = 401;
      errorCode = 'UNAUTHORIZED';
    } else if (error.message.includes('forbidden') || error.message.includes('permission')) {
      status = 403;
      errorCode = 'FORBIDDEN';
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      status = 400;
      errorCode = 'VALIDATION_ERROR';
    } else if (error.message.includes('rate limit')) {
      status = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
    }
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    error: errorCode,
    message: errorMessage,
    timestamp,
    requestId,
  };

  // Log error (in production, send to external logging service)
  console.error('Error occurred:', {
    error: errorMessage,
    code: errorCode,
    status,
    requestId,
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('User-Agent'),
    timestamp,
  });

  // Return error response
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}

// Validation error handler
export function validationErrorHandler(errors: any[]): Response {
  const timestamp = new Date().toISOString();
  
  const errorResponse: ErrorResponse = {
    error: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    code: 'VALIDATION_ERROR',
    timestamp,
    details: errors,
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Database error handler
export function databaseErrorHandler(error: any, request: Request): Response {
  const timestamp = new Date().toISOString();
  const requestId = request.headers.get('CF-Ray') || 'unknown';
  
  let status = 500;
  let errorMessage = 'Database operation failed';
  let errorCode = 'DATABASE_ERROR';

  // Handle specific database errors
  if (error.message?.includes('unique constraint')) {
    status = 409;
    errorCode = 'DUPLICATE_ENTRY';
    errorMessage = 'Resource already exists';
  } else if (error.message?.includes('foreign key')) {
    status = 400;
    errorCode = 'INVALID_REFERENCE';
    errorMessage = 'Invalid reference to related resource';
  } else if (error.message?.includes('connection')) {
    status = 503;
    errorCode = 'DATABASE_UNAVAILABLE';
    errorMessage = 'Database temporarily unavailable';
  }

  const errorResponse: ErrorResponse = {
    error: errorCode,
    message: errorMessage,
    timestamp,
    requestId,
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}

// Blockchain error handler
export function blockchainErrorHandler(error: any, request: Request): Response {
  const timestamp = new Date().toISOString();
  const requestId = request.headers.get('CF-Ray') || 'unknown';
  
  let status = 500;
  let errorMessage = 'Blockchain operation failed';
  let errorCode = 'BLOCKCHAIN_ERROR';

  // Handle specific blockchain errors
  if (error.message?.includes('insufficient funds')) {
    status = 400;
    errorCode = 'INSUFFICIENT_FUNDS';
    errorMessage = 'Insufficient funds for transaction';
  } else if (error.message?.includes('gas limit')) {
    status = 400;
    errorCode = 'GAS_LIMIT_EXCEEDED';
    errorMessage = 'Transaction gas limit exceeded';
  } else if (error.message?.includes('network')) {
    status = 503;
    errorCode = 'BLOCKCHAIN_NETWORK_ERROR';
    errorMessage = 'Blockchain network temporarily unavailable';
  }

  const errorResponse: ErrorResponse = {
    error: errorCode,
    message: errorMessage,
    timestamp,
    requestId,
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
  });
}
