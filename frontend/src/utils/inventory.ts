import { sarees } from '@/data/products';

export interface ProductWithStock {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  image: string;
}

const INVENTORY_KEY = 'productInventory';

/**
 * Initialize inventory from products data
 */
export const initializeInventory = () => {
  const existing = localStorage.getItem(INVENTORY_KEY);

  if (!existing) {
    const inventory = sarees.map(p => ({
      id: p.id,
      stock: p.stock
    }));

    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
};

/**
 * Get current inventory
 */
export const getInventory = (): { id: number; stock: number }[] => {
  initializeInventory();
  const data = localStorage.getItem(INVENTORY_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Update stock after purchase
 */
export const updateStock = (
  productId: number,
  quantity: number = 1
): boolean => {
  const inventory = getInventory();
  const product = inventory.find(p => p.id === productId);

  if (product && product.stock >= quantity) {
    product.stock -= quantity;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    return true;
  }

  return false;
};

/**
 * Get single product with current stock
 */
export const getProductWithStock = (
  productId: number
): ProductWithStock | null => {
  const inventory = getInventory();
  const product = sarees.find(p => p.id === productId);

  if (!product) return null;

  const stockItem = inventory.find(i => i.id === productId);

  return {
    ...product,
    stock: stockItem?.stock ?? product.stock
  };
};

/**
 * Get all products with current stock
 */
export const getAllProductsWithStock = (): ProductWithStock[] => {
  const inventory = getInventory();

  return sarees.map(product => {
    const stockItem = inventory.find(i => i.id === product.id);

    return {
      ...product,
      stock: stockItem?.stock ?? product.stock
    };
  });
};
