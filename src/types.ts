import { CartService } from "./services/CartService";

export interface CartItem {
  sku: string;
  quantity: number;
}

export interface ExperienceCart {
  cartId: string;
  items: CartItem[];
}

export interface CartRecord {
  experienceCartId: string;
  salesforceContextId: string;
  items: CartItem[];
}

export interface CreateAppOptions {
  cartService?: CartService;
}