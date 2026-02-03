import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors';

export const parseWithSchema = <T>(schema: ZodSchema<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join('; ');
    throw new ValidationError(message);
  }
  return result.data;
};
