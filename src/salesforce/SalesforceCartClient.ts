import { randomUUID } from 'crypto';
import { CartItem } from '../types';
import {
  CartItemNotFoundError,
  SalesforceContextExpiredError,
  SalesforceContextMissingError,
} from '../errors';

/**
 * cloneItems creates a deep copy of an array of cart items
 * @param items - Array of cart items to clone
 * @returns A new array with cloned items
 */
const cloneItems = (items: CartItem[]): CartItem[] => items.map((item) => ({ ...item }));

/**
 * SalesforceCartClientOptions defines the configuration options for the Salesforce cart client.
 */
export interface SalesforceCartClientOptions {
  contextTtlMs?: number;
  now?: () => number;
}

/**
 * SalesforceCartContext represents a cart context in Salesforce.
 */
interface SalesforceCartContext {
  contextId: string;
  expiresAt: number;
  items: CartItem[];
}

/**
 * SalesforceCartClient is a mock implementation of a Salesforce cart client.
 * It manages cart contexts in memory with expiration tracking.
 */
export class SalesforceCartClient {
  private readonly contextTtlMs: number;
  private readonly now: () => number;
  private readonly contexts = new Map<string, SalesforceCartContext>();

  /**
   * Creates a new Salesforce cart client with the given options.
   * @param options - Configuration options for the client.
   */
  constructor(options: SalesforceCartClientOptions = {}) {
    this.contextTtlMs = options.contextTtlMs ?? 5 * 60 * 1000;
    this.now = options.now ?? Date.now;
  }

  /**
   * createContext is a method that creates a new Salesforce cart context with
   * a unique ID and expiration.
   *
   * It initializes an in-memory shopping session in the SalesforceCartClient, generating a context ID
   * prefixed with sf_, setting an expiration timestamp based on TTL, and returning an empty cart.
   * This context is stored in a Map and must be used for subsequent cart operations like adding items.
   * @returns A promise that resolves to the context ID and initial empty items array.
   */
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

  /**
   * The getItems method is part of the SalesforceCartClient class, 
   * which simulates interaction with a Salesforce cart system in memory. 
   * This method retrieves the current list of CartItem objects associated 
   * with a given contextId, representing a user's shopping session.
   * @param contextId - The ID of the cart context.
   * @returns A promise that resolves to the items in the cart.
   * @throws {SalesforceContextMissingError} If the context does not exist.
   * @throws {SalesforceContextExpiredError} If the context has expired.
   */
  async getItems(contextId: string): Promise<CartItem[]> {
    const context = this.ensureActiveContext(contextId);
    return cloneItems(context.items);
  }

  /**
   * addItem is an asynchronous method on the SalesforceCartClient class 
   * that adds a CartItem to a cart context identified by contextId. 
   * If an item with the same SKU already exists, it increments the quantity 
   * instead of adding a duplicate.
   * @param contextId - The ID of the cart context.
   * @param item - The item to add.
   * @returns A promise that resolves to the updated items in the cart.
   * @throws {SalesforceContextMissingError} If the context does not exist.
   * @throws {SalesforceContextExpiredError} If the context has expired.
   */
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

  /**
   * `setItems` is an instance method of the SalesforceCartClient class. It sets
   * the full list of items in a specified cart context, replacing any existing
   * items. The method performs validation by checking that the context exists
   * and has not expired, using ensureActiveContext..
   * @param contextId - The ID of the cart context.
   * @param items - The items to set.
   * @returns A promise that resolves to the updated items in the cart.
   * @throws {SalesforceContextMissingError} If the context does not exist.
   * @throws {SalesforceContextExpiredError} If the context has expired.
   */
  async setItems(contextId: string, items: CartItem[]): Promise<CartItem[]> {
    const context = this.ensureActiveContext(contextId);
    context.items = cloneItems(items);
    return cloneItems(context.items);
  }

  async removeItem(contextId: string, sku: string): Promise<CartItem[]> {
    const context = this.ensureActiveContext(contextId);
    const index = context.items.findIndex((item) => item.sku === sku);
    if (index === -1) {
      throw new CartItemNotFoundError(sku);
    }
    context.items.splice(index, 1);
    return cloneItems(context.items);
  }

  /**
   * Ensures that a cart context is active and not expired.
   * @param contextId - The ID of the cart context.
   * @returns The active cart context.
   * @throws {SalesforceContextMissingError} If the context does not exist.
   * @throws {SalesforceContextExpiredError} If the context has expired.
   */
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

  /**
   * Checks if a cart context has expired.
   * @param context - The cart context to check.
   * @returns True if the context has expired, false otherwise.
   */
  private isExpired(context: SalesforceCartContext): boolean {
    return this.now() >= context.expiresAt;
  }
}
