export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  // Validation errors (400)
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_PARAMETER: "MISSING_PARAMETER",
  INVALID_ID: "INVALID_ID",
  INVALID_MEDIA_TYPE: "INVALID_MEDIA_TYPE",
  INVALID_REGION: "INVALID_REGION",
  INVALID_SERVICE_ID: "INVALID_SERVICE_ID",
  INVALID_GENRE_ID: "INVALID_GENRE_ID",
  INVALID_TIME_BUDGET: "INVALID_TIME_BUDGET",
  QUERY_TOO_LONG: "QUERY_TOO_LONG",

  // Authentication/Authorization errors (401/403)
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  API_KEY_MISSING: "API_KEY_MISSING",

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // External API errors (502/503)
  TMDB_API_ERROR: "TMDB_API_ERROR",
  TMDB_NOT_FOUND: "TMDB_NOT_FOUND",
  OLLAMA_CONNECTION_FAILED: "OLLAMA_CONNECTION_FAILED",
  OLLAMA_MODEL_NOT_FOUND: "OLLAMA_MODEL_NOT_FOUND",
  EMBEDDING_MODEL_FAILED: "EMBEDDING_MODEL_FAILED",

  // Internal errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  VECTOR_STORE_EMPTY: "VECTOR_STORE_EMPTY",
  KNOWLEDGE_BASE_NOT_READY: "KNOWLEDGE_BASE_NOT_READY",
  CACHE_ERROR: "CACHE_ERROR",

  // Not found (404)
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorResponse(error: unknown): { error: string; code: string; statusCode: number; details?: Record<string, unknown> } {
  if (isAppError(error)) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: ErrorCodes.INTERNAL_ERROR,
      statusCode: 500,
    };
  }

  return {
    error: "An unknown error occurred",
    code: ErrorCodes.INTERNAL_ERROR,
    statusCode: 500,
  };
}

export function createErrorResponse(error: unknown) {
  const { error: message, code, statusCode, details } = getErrorResponse(error);
  return Response.json({ error: message, code, details }, { status: statusCode });
}

export function validationError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(message, ErrorCodes.INVALID_INPUT, 400, details);
}

export function notFoundError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(message, ErrorCodes.NOT_FOUND, 404, details);
}

export function rateLimitError(message: string = "Too many requests", details?: Record<string, unknown>): AppError {
  return new AppError(message, ErrorCodes.RATE_LIMIT_EXCEEDED, 429, details);
}

export function tmdbError(message: string, statusCode: number = 502, details?: Record<string, unknown>): AppError {
  return new AppError(message, ErrorCodes.TMDB_API_ERROR, statusCode, details);
}

export function ollamaError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(message, ErrorCodes.OLLAMA_CONNECTION_FAILED, 503, details);
}

export function internalError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(message, ErrorCodes.INTERNAL_ERROR, 500, details);
}