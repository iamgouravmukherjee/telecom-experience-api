import { CartItem, CartRecord } from '../types';

/**
 * cloneItems creates a deep copy of an array of cart items
 * @param items - Array of cart items to clone
 * @returns A new array with cloned items
 */
const cloneItems = (items: CartItem[]): CartItem[] => items.map((item) => ({ ...item }));

/**
 * cloneRecord creates a deep copy of a cart record
 * @param record - Cart record to clone
 * @returns A new cart record with cloned data
 */
const cloneRecord = (record: CartRecord): CartRecord => ({
  experienceCartId: record.experienceCartId,
  salesforceContextId: record.salesforceContextId,
  items: cloneItems(record.items),
});

export class InMemoryCartStore {
  private readonly carts = new Map<string, CartRecord>();

  /**
   * getCart retrieves a cart record by its experience cart ID
   * @param experienceCartId - The unique identifier for the cart
   * @returns The cart record if found, undefined otherwise
   */
  getCart(experienceCartId: string): CartRecord | undefined {
    const record = this.carts.get(experienceCartId);
    return record ? cloneRecord(record) : undefined;
  }

  /**
   * saveCart saves a cart record to the in-memory store
   * @param record - The cart record to save
   */
  saveCart(record: CartRecord): void {
    this.carts.set(record.experienceCartId, cloneRecord(record));
  }

  /**
   * deleteCart removes a cart record from the in-memory store
   * @param experienceCartId - The unique identifier for the cart to delete
   */
  deleteCart(experienceCartId: string): void {
    this.carts.delete(experienceCartId);
  }

  /**
   * listCarts returns all cart records from the in-memory store
   * @returns An array of all cart records
   */
  listCarts(): CartRecord[] {
    return Array.from(this.carts.values()).map(cloneRecord);
  }
}
