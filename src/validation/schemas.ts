import { z } from 'zod';

export const cartIdParamsSchema = z.object({
  cartId: z.string().min(1),
}).strict();

export const addItemBodySchema = z
  .object({
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
  })
  .strict();

export const deleteItemParamsSchema = z
  .object({
    cartId: z.string().min(1),
    sku: z.string().min(1),
  })
  .strict();
