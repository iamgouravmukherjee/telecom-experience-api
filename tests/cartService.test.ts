import { describe, expect, it } from 'vitest';
import { CartService } from '../src/services/CartService';
import { InMemoryCartStore } from '../src/store/inMemoryCartStore';
import { SalesforceCartClient } from '../src/salesforce/SalesforceCartClient';
import { ValidationError, CartNotFoundError, CartItemNotFoundError } from '../src/errors';

const createCartServiceHarness = () => {
  let currentTime = 0;
  const store = new InMemoryCartStore();
  const salesforceClient = new SalesforceCartClient({ contextTtlMs: 1000, now: () => currentTime });
  const service = new CartService({
    store,
    salesforceClient,
    experienceCartIdFactory: () => 'exp_test',
  });

  return {
    service,
    store,
    salesforceClient,
    advanceTime: (ms: number) => {
      currentTime += ms;
    },
  };
};

describe('CartService', () => {
  it('creates a cart with a stable id', async () => {
    const { service } = createCartServiceHarness();
    const cart = await service.createCart();

    expect(cart).toEqual({ cartId: 'exp_test', items: [] });
  });

  it('adds items and recovers after Salesforce context expiration', async () => {
    const { service, advanceTime } = createCartServiceHarness();

    await service.createCart();
    await service.addItem('exp_test', { sku: 'PLAN', quantity: 1 });

    advanceTime(2000); // force context expiration

    const updatedCart = await service.addItem('exp_test', { sku: 'DEVICE', quantity: 1 });

    expect(updatedCart.items).toEqual([
      { sku: 'PLAN', quantity: 1 },
      { sku: 'DEVICE', quantity: 1 },
    ]);
  });

  it('throws validation errors for invalid items', async () => {
    const { service } = createCartServiceHarness();
    await service.createCart();

    await expect(service.addItem('exp_test', { sku: '', quantity: 1 })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(service.addItem('exp_test', { sku: 'PLAN', quantity: 0 })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('removes items and errors when sku missing', async () => {
    const { service } = createCartServiceHarness();
    await service.createCart();
    await service.addItem('exp_test', { sku: 'PLAN', quantity: 1 });

    const updated = await service.removeItem('exp_test', 'PLAN');
    expect(updated.items).toEqual([]);

    await expect(service.removeItem('exp_test', 'PLAN')).rejects.toBeInstanceOf(
      CartItemNotFoundError,
    );
  });

  it('throws when cart does not exist', async () => {
    const { service } = createCartServiceHarness();
    await expect(service.getCart('missing')).rejects.toBeInstanceOf(CartNotFoundError);
  });
});
