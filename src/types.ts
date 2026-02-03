import type { CartService } from './services/CartService';

/**
 * Represents a cart item with SKU and quantity.
 */
export interface CartItem {
  sku: string;
  quantity: number;
}

/**
 * Represents an experience cart with a cart ID and items.
 */
export interface ExperienceCart {
  cartId: string;
  items: CartItem[];
}

/**
 * Represents a cart record with experience cart ID, Salesforce context ID, and items.
 */
export interface CartRecord {
  experienceCartId: string;
  salesforceContextId: string;
  items: CartItem[];
}

export interface AppConfig {
  name: string;
  port: number;
  apiKey: string;
  salesforceContextTtlMs: number;
}

/**
 * Options for creating the Express app.
 */
export interface CreateAppOptions {
  cartService?: CartService;
  config?: AppConfig;
  enableDocs?: boolean;
}