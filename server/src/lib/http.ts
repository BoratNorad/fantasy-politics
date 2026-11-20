import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';

/** Throw this from a route to send a specific status + message. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Not found') => new HttpError(404, what);
export const forbidden = (what = 'Forbidden') => new HttpError(403, what);
export const badRequest = (what: string) => new HttpError(400, what);

/** Parse and validate a request body, throwing a 400 with a readable message. */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.infer<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, formatZodError(result.error));
  }
  return result.data;
}

export function formatZodError(err: ZodError): string {
  return err.issues
    .map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message))
    .join('; ');
}

/** Express 5 forwards async errors here automatically. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Prisma unique-constraint violation
  if (typeof err === 'object' && err && (err as { code?: string }).code === 'P2002') {
    res.status(409).json({ error: 'That value is already taken.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}

/** Read a route param as a string (Express 5 types allow string | string[]). */
export function param(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : String(v);
}
