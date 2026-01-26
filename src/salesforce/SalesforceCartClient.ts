import { randomUUID } from 'crypto';
import { CartItem } from '../types';
import {
  SalesforceContextExpiredError,
  SalesforceContextMissingError,
} from '../errors';

const cloneItems = (items: CartItem[]): CartItem[] => items.map((item) => ({ ...item }));

export interface SalesforceCartClientOptions {
  contextTtlMs?: number;
  now?: () => number;
}

interface SalesforceCartContext {
  contextId: string;
  expiresAt: number;
  items: CartItem[];
}

export class SalesforceCartClient {
  private readonly contextTtlMs: number;
  private readonly now: () => number;
  private readonly contexts = new Map<string, SalesforceCartContext>();

  constructor(options: SalesforceCartClientOptions = {}) {
    this.contextTtlMs = options.contextTtlMs ?? 1 * 60 * 1000; // default 1 minutes
    this.now = options.now ?? Date.now;
  }

  async createContext(): Promise<{ contextId: string; items: CartItem[] }> {
    const contextId = `sf_${randomUUID()}`;
    const context: SalesforceCartContext = {
      contextId,
      expiresAt: this.now() + this.contextTtlMs,
      items: [],
    };
    this.contexts.set(contextId, context);
    return { contextId, items: [] };
  }

  async getItems(contextId: string): Promise<CartItem[]> {
    const context = this.ensureActiveContext(contextId);
    return cloneItems(context.items);
  }

  async addItem(contextId: string, item: CartItem): Promise<CartItem[]> {
    const context = this.ensureActiveContext(contextId);
    const existing = context.items.find((i) => i.sku === item.sku);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      context.items.push({ ...item });
    }
    return cloneItems(context.items);
  }

  async setItems(contextId: string, items: CartItem[]): Promise<CartItem[]> {
    const context = this.ensureActiveContext(contextId);
    context.items = cloneItems(items);
    return cloneItems(context.items);
  }

  private ensureActiveContext(contextId: string): SalesforceCartContext {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new SalesforceContextMissingError(contextId);
    }

    if (this.isExpired(context)) {
      this.contexts.delete(contextId);
      throw new SalesforceContextExpiredError(contextId);
    }

    return context;
  }

  private isExpired(context: SalesforceCartContext): boolean {
    return this.now() >= context.expiresAt;
  }
}
