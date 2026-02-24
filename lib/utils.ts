import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates that a string is a valid UUID v4 format.
 * Returns false for semantic strings like "new", "", null, undefined.
 */
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Returns the id if it is a valid UUID, otherwise null.
 * Prevents 22P02 errors from semantic strings like "new" or empty strings.
 */
export function sanitizeUUID(id: string | null | undefined): string | null {
  return isValidUUID(id) ? (id as string) : null
}
