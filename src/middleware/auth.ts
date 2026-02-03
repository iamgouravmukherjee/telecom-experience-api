import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors';

const API_KEY_HEADER = 'x-api-key';

/** 
 * createAuthMiddleware creates an authentication middleware that validates the API key
 * @param expectedApiKey - The expected API key to validate against
 * @returns A middleware function that validates the API key
 */
export const createAuthMiddleware = (expectedApiKey: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If no API key is configured, skip authentication
    if (!expectedApiKey) {
      return next();
    }

    // Get the API key from the request header
    const providedKey = req.header(API_KEY_HEADER);
    if (!providedKey || providedKey !== expectedApiKey) {
    // If the API key is invalid, return an unauthorized error
      return next(new UnauthorizedError());
    }
    // If the API key is valid, continue to the next middleware
    next();
  };
};
