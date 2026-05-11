import { create } from 'zustand';
import { FnBMenuItem } from '../types';
import { fnbService } from '../services/fnbService';

interface FnBState {
  menuItems: FnBMenuItem[];
  cart: { menuItemId: number; quantity: number; item: FnBMenuItem }[];
  isLoading: boolean;
  fetchMenuItems: () => Promise<void>;
  addToCart: (item: FnBMenuItem, quantity?: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useFnBStore = create<FnBState>((set) => ({
  menuItems: [],
  cart: [],
  isLoading: false,
  
  fetchMenuItems: async () => {
    set({ isLoading: true });
    try {
      const menuItems = await fnbService.getMenuItems();
      set({ menuItems });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addToCart: (item, quantity = 1) => set((state) => {
    const existing = state.cart.find(c => c.menuItemId === item.id);
    if (existing) {
      return {
        cart: state.cart.map(c => 
          c.menuItemId === item.id 
            ? { ...c, quantity: c.quantity + quantity }
            : c
        )
      };
    }
    return { cart: [...state.cart, { menuItemId: item.id, quantity, item }] };
  }),
  
  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(c => c.menuItemId !== itemId)
  })),
  
  updateQuantity: (itemId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { cart: state.cart.filter(c => c.menuItemId !== itemId) };
    }
    return {
      cart: state.cart.map(c => 
        c.menuItemId === itemId ? { ...c, quantity } : c
      )
    };
  }),
  
  clearCart: () => set({ cart: [] })
}));
