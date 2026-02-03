import express, { NextFunction, Request, Response } from 'express';
import { CartService } from './services/CartService';
import { InMemoryCartStore } from './store/inMemoryCartStore';
import { SalesforceCartClient } from './salesforce/SalesforceCartClient';
import {
  CartNotFoundError,
  CartRecoveryFailedError,
  ValidationError,
} from './errors';
import { CreateAppOptions } from './types';


/**
 * buildDefaultCartService is a factory function that creates and returns a default CartService instance.
 *
 * It initializes the CartService with an in-memory store and a Salesforce client,
 * providing a ready-to-use implementation for cart management when no custom service is provided.
 * @returns CartService with default dependencies
 */
const buildDefaultCartService = (): CartService => {
  const store = new InMemoryCartStore();
  const salesforceClient = new SalesforceCartClient();
  return new CartService({ store, salesforceClient });
};

/**
 * asyncHandler is a higher-order function that wraps async route handlers to properly handle errors.
 * It catches any errors thrown by the async handler and passes them to the next middleware,
 * ensuring that unhandled promise rejections don't crash the server.
 *
 * @param handler - The async route handler function to wrap
 * @returns A middleware function that handles async operations safely
 */
const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
};

/**
 * createApp is the main factory function that creates and configures the Express application.
 * It sets up all routes, middleware, and error handling for the cart management API.
 *
 * @param options - Optional configuration object that can override the default CartService
 * @returns Configured Express application instance
 */
export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  const cartService = options.cartService ?? buildDefaultCartService();

  app.use(express.json());

  /**
   * POST /cart - Create a new cart
   * Creates a new cart and returns its details
   */
  app.post(
    '/cart',
    asyncHandler(async (_req, res) => {
      const cart = await cartService.createCart();
      res.status(200).json(cart);
    }),
  );

  /**
   * GET /cart/:cartId - Get cart details
   * Retrieves the details of a specific cart by its ID
   */
  app.get(
    '/cart/:cartId',
    asyncHandler(async (req, res) => {
      const cartId = req.params.cartId;
      if (!cartId) {
        throw new ValidationError('cartId is required');
      }
      const cart = await cartService.getCart(cartId);
      res.status(200).json(cart);
    }),
  );

  /**
   * POST /cart/:cartId/items - Add item to cart
   * Adds a product item to the specified cart
   */
  app.post(
    '/cart/:cartId/items',
    asyncHandler(async (req, res) => {
      const cartId = req.params.cartId;
      if (!cartId) {
        throw new ValidationError('cartId is required');
      }

      const { sku, quantity } = req.body ?? {};
      if (typeof sku !== 'string' || sku.trim().length === 0) {
        throw new ValidationError('sku must be a non-empty string');
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new ValidationError('quantity must be a positive integer');
      }
      const cart = await cartService.addItem(cartId, { sku, quantity });
      res.status(200).json(cart);
    }),
  );

  /**
   * Global error handler
   * Catches and handles all errors thrown by route handlers
   */
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof CartNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof CartRecoveryFailedError) {
        return res.status(409).json({ error: error.message });
      }

      console.error('Unexpected error', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    },
  );

  return app;
};
