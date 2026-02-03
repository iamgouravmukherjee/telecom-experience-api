import { randomUUID } from 'crypto';
import { CartItem, CartRecord, ExperienceCart } from '../types';
import {
  CartNotFoundError,
  CartRecoveryFailedError,
  SalesforceContextExpiredError,
  SalesforceContextMissingError,
  ValidationError,
} from '../errors';
import { InMemoryCartStore } from '../store/inMemoryCartStore';
import { SalesforceCartClient } from '../salesforce/SalesforceCartClient';

export interface CartServiceDependencies {
  store: InMemoryCartStore;
  salesforceClient: SalesforceCartClient;
  experienceCartIdFactory?: () => string;
}

const cloneItems = (items: CartItem[]): CartItem[] => items.map((item) => ({ ...item }));

export class CartService {
  private readonly store: InMemoryCartStore;
  private readonly salesforceClient: SalesforceCartClient;
  private readonly experienceCartIdFactory: () => string;

  constructor(dependencies: CartServiceDependencies) {
    this.store = dependencies.store;
    this.salesforceClient = dependencies.salesforceClient;
    this.experienceCartIdFactory =
      dependencies.experienceCartIdFactory ?? (() => `exp_${randomUUID()}`);
  }

  /**
   * Creates a new cart.
   * @returns The created cart.
   */
  async createCart(): Promise<ExperienceCart> {
    const experienceCartId = this.experienceCartIdFactory();
    const { contextId: salesforceContextId, items } = await this.salesforceClient.createContext();
    const record: CartRecord = {
      experienceCartId,
      salesforceContextId,
      items,
    };
    this.store.saveCart({ ...record, items: cloneItems(items) });
    return { cartId: experienceCartId, items: cloneItems(items) };
  }

  /**
   * Retrieves the cart with the given ID.
   * @param cartId The ID of the cart to retrieve.
   * @returns The cart with the given ID.
   */
  async getCart(cartId: string): Promise<ExperienceCart> {
    const record = this.getCartOrThrow(cartId);
    const { result: items } = await this.runWithRecovery(record, (contextId) =>
      this.salesforceClient.getItems(contextId),
    );
    this.persistSnapshot(cartId, items);
    return { cartId, items: cloneItems(items) };
  }

  /**
   * Adds an item to the cart.
   * @param cartId The ID of the cart to which the item should be added.
   * @param item The item to add to the cart.
   * @returns The updated cart. 
   */
  async addItem(cartId: string, item: CartItem): Promise<ExperienceCart> {
    this.validateCartItem(item);
    const record = this.getCartOrThrow(cartId);
    const { result: items, record: updatedRecord } = await this.runWithRecovery(
      record,
      (contextId) => this.salesforceClient.addItem(contextId, item),
    );
    this.store.saveCart({ ...updatedRecord, items: cloneItems(items) });
    return { cartId, items: cloneItems(items) };
  }

  async removeItem(cartId: string, sku: string): Promise<ExperienceCart> {
    this.validateSku(sku);
    const record = this.getCartOrThrow(cartId);
    const { result: items, record: updatedRecord } = await this.runWithRecovery(
      record,
      (contextId) => this.salesforceClient.removeItem(contextId, sku),
    );
    this.store.saveCart({ ...updatedRecord, items: cloneItems(items) });
    return { cartId, items: cloneItems(items) };
  }

  /**
   * Retrieves the cart with the given ID.
   * @param cartId The ID of the cart to retrieve.
   * @returns The cart with the given ID.
   */
  private getCartOrThrow(cartId: string): CartRecord {
    const record = this.store.getCart(cartId);
    if (!record) {
      throw new CartNotFoundError(cartId);
    }
    return record;
  }
 
  /**
   * Runs the given operation with recovery logic.
   * @param record The cart record to run the operation on.
   * @param operation The operation to run.
   * @returns The result of the operation and the updated cart record.
   */
  private async runWithRecovery<T>(
    record: CartRecord,
    operation: (contextId: string) => Promise<T>,
  ): Promise<{ result: T; record: CartRecord }> {
    try {
      const result = await operation(record.salesforceContextId);
      return { result, record };
    } catch (error) {
      if (
        !(error instanceof SalesforceContextExpiredError) &&
        !(error instanceof SalesforceContextMissingError)
      ) {
        throw error;
      }
      const recoveredRecord = await this.recoverCart(record);
      try {
        const result = await operation(recoveredRecord.salesforceContextId);
        return { result, record: recoveredRecord };
      } catch (secondError) {
        if (
          secondError instanceof SalesforceContextExpiredError ||
          secondError instanceof SalesforceContextMissingError
        ) {
          throw new CartRecoveryFailedError(record.experienceCartId);
        }
        throw secondError;
      }
    }
  }

  /**
   * Recovers the cart by creating a new Salesforce context and persisting the cart record.
   * @param record The cart record to recover.
   * @returns The recovered cart record.
   */
  private async recoverCart(record: CartRecord): Promise<CartRecord> {
    try {
      const { contextId: newContextId } = await this.salesforceClient.createContext();
      if (record.items.length > 0) {
        await this.salesforceClient.setItems(newContextId, record.items);
      }
      const recoveredRecord: CartRecord = {
        ...record,
        salesforceContextId: newContextId,
      };
      this.store.saveCart(recoveredRecord);
      return recoveredRecord;
    } catch (error) {
      throw new CartRecoveryFailedError(record.experienceCartId, (error as Error).message);
    }
  }

  /**
   * Persists the cart snapshot to the store.
   * @param cartId The ID of the cart to persist.
   * @param items The items to persist.
   */
  private persistSnapshot(cartId: string, items: CartItem[]): void {
    const record = this.getCartOrThrow(cartId);
    this.store.saveCart({ ...record, items: cloneItems(items) });
  }

  /**
   * Validates the cart item.
   * @param item The cart item to validate.
   */
  private validateCartItem(item: CartItem): void {
    this.validateSku(item.sku);
    this.validateQuantity(item.quantity);
  }

  private validateSku(sku: string): void {
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
      throw new ValidationError('sku must be a non-empty string');
    }
  }

  private validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('quantity must be a positive integer');
    }
  }
}
