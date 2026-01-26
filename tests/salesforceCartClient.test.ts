import { describe, expect, it } from 'vitest';
import { SalesforceCartClient } from '../src/salesforce/SalesforceCartClient';
import {
  SalesforceContextExpiredError,
  SalesforceContextMissingError,
} from '../src/errors';

const createClientWithClock = (contextTtlMs = 1_000) => {
  let currentTime = 0;
  return {
    client: new SalesforceCartClient({ contextTtlMs, now: () => currentTime }),
    advanceTime: (ms: number) => {
      currentTime += ms;
    },
  };
};

describe('SalesforceCartClient', () => {
  it('creates a context with empty items', async () => {
    const { client } = createClientWithClock();
    const { contextId, items } = await client.createContext();

    expect(contextId).toMatch(/^sf_/);
    expect(items).toEqual([]);

    const fetched = await client.getItems(contextId);
    expect(fetched).toEqual([]);
  });

  it('adds items and aggregates quantities by SKU', async () => {
    const { client } = createClientWithClock();
    const { contextId } = await client.createContext();

    await client.addItem(contextId, { sku: 'PLAN', quantity: 1 });
    await client.addItem(contextId, { sku: 'PLAN', quantity: 2 });
    await client.addItem(contextId, { sku: 'DEVICE', quantity: 1 });

    const items = await client.getItems(contextId);
    expect(items).toEqual([
      { sku: 'PLAN', quantity: 3 },
      { sku: 'DEVICE', quantity: 1 },
    ]);
  });

  it('throws when operations target an expired context', async () => {
    const { client, advanceTime } = createClientWithClock(500);
    const { contextId } = await client.createContext();

    advanceTime(1000);

    await expect(client.getItems(contextId)).rejects.toBeInstanceOf(
      SalesforceContextExpiredError,
    );
  });

  it('throws when operations target a missing context', async () => {
    const { client } = createClientWithClock();
    await expect(client.getItems('unknown')).rejects.toBeInstanceOf(
      SalesforceContextMissingError,
    );
  });
});
