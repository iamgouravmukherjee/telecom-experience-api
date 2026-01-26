import { CartItem, CartRecord } from '../types';

const cloneItems = (items: CartItem[]): CartItem[] => items.map((item) => ({ ...item }));

const cloneRecord = (record: CartRecord): CartRecord => ({
  experienceCartId: record.experienceCartId,
  salesforceContextId: record.salesforceContextId,
  items: cloneItems(record.items),
});

export class InMemoryCartStore {
  private readonly carts = new Map<string, CartRecord>();

  getCart(experienceCartId: string): CartRecord | undefined {
    const record = this.carts.get(experienceCartId);
    return record ? cloneRecord(record) : undefined;
  }

  saveCart(record: CartRecord): void {
    this.carts.set(record.experienceCartId, cloneRecord(record));
  }

  deleteCart(experienceCartId: string): void {
    this.carts.delete(experienceCartId);
  }

  listCarts(): CartRecord[] {
    return Array.from(this.carts.values()).map(cloneRecord);
  }
}
