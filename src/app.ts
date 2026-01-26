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


const buildDefaultCartService = (): CartService => {
  const store = new InMemoryCartStore();
  const salesforceClient = new SalesforceCartClient();
  return new CartService({ store, salesforceClient });
};

const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
};

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();
  const cartService = options.cartService ?? buildDefaultCartService();

  app.use(express.json());

  app.post(
    '/cart',
    asyncHandler(async (_req, res) => {
      const cart = await cartService.createCart();
      res.status(200).json(cart);
    }),
  );

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
