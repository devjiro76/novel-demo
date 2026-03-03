/**
 * Shared API route utilities — Zod validation helpers, error formatting.
 */
import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

/**
 * Parse and validate request body with a Zod schema.
 * Returns the parsed data or a 400 NextResponse.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return { error: NextResponse.json({ error: `Validation failed: ${issues}` }, { status: 400 }) };
  }

  return { data: result.data };
}

/**
 * Format error for API response — avoids leaking stack traces.
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Internal error';
}
