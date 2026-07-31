import { AppError } from "./errors";

export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
}

export function sanitizeNumber(input: unknown, min: number = 1, max: number = 100): number {
  const num = Number(input);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

export function sanitizeBoolean(input: unknown): boolean {
  if (typeof input === "boolean") return input;
  if (typeof input === "string") return input === "true";
  return Boolean(input);
}

export function sanitizeArray<T>(input: unknown, validator: (item: unknown) => T, maxLength: number = 50): T[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, maxLength).map(validator).filter((v): v is T => v !== null && v !== undefined);
}

export function validateSearchQuery(query: unknown): string {
  const sanitized = sanitizeString(query as string, 200);
  if (sanitized.length < 2) {
    throw new AppError("Query must be at least 2 characters", "VALIDATION_ERROR", 400);
  }
  return sanitized;
}

export function validateId(id: unknown): number {
  const num = sanitizeNumber(id, 1, Number.MAX_SAFE_INTEGER);
  if (num < 1) throw new AppError("Invalid ID", "VALIDATION_ERROR", 400);
  return num;
}

export function validateMediaType(type: unknown): "tv" | "movie" {
  if (type === "tv" || type === "movie") return type;
  throw new AppError("Invalid media type", "VALIDATION_ERROR", 400);
}

export function validateRegion(region: unknown): string {
  const sanitized = sanitizeString(region as string, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(sanitized)) return "US";
  return sanitized;
}

export function validateTimeBudget(budget: unknown): number | null {
  const num = sanitizeNumber(budget, 0, 1440);
  return num === 0 ? null : num;
}

export function validateServiceIds(services: unknown): string[] {
  return sanitizeArray(services, (item) => sanitizeString(item as string, 50), 20);
}

export function validateGenreIds(genres: unknown): string[] {
  return sanitizeArray(genres, (item) => sanitizeString(item as string, 50), 20);
}