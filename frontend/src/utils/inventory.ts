import { sarees, sweets } from '@/data/products';

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

// Initialize inventory from products data
export const initializeInventory = () => {
  const existing = localStorage.getItem(INVENTORY_KEY);
  if (!existing) {
    const inventory = {
      sarees: sarees.map(s => ({ id: s.id, stock: s.stock })),
      sweets: sweets.map(p => ({ id: p.id, stock: p.stock }))
    };
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
};

// Get current inventory
export const getInventory = () => {
  initializeInventory();
  const data = localStorage.getItem(INVENTORY_KEY);
  return data ? JSON.parse(data) : { sarees: [], sweets: [] };
};

// Update stock after purchase
export const updateStock = (productId: number, type: 'saree' | 'sweet', quantity: number = 1): boolean => {
  const inventory = getInventory();
  const productList = type === 'saree' ? inventory.sarees : inventory.sweets;
  const product = productList.find((p: any) => p.id === productId);
  
  if (product && product.stock >= quantity) {
    product.stock -= quantity;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    return true;
  }
  
  return false;
};

// Get product with current stock
export const getProductWithStock = (productId: number, type: 'saree' | 'sweet'): ProductWithStock | null => {
  const inventory = getInventory();
  const sourceList = type === 'saree' ? sarees : sweets;
  const product = sourceList.find(p => p.id === productId);
  
  if (!product) return null;
  
  const stockList = type === 'saree' ? inventory.sarees : inventory.sweets;
  const stockItem = stockList.find((s: any) => s.id === productId);
  
  return {
    ...product,
    stock: stockItem?.stock ?? product.stock
  };
};

// Get all products with current stock
export const getAllProductsWithStock = (type: 'saree' | 'sweet'): ProductWithStock[] => {
  const inventory = getInventory();
  const sourceList = type === 'saree' ? sarees : sweets;
  const stockList = type === 'saree' ? inventory.sarees : inventory.sweets;
  
  return sourceList.map(product => {
    const stockItem = stockList.find((s: any) => s.id === product.id);
    return {
      ...product,
      stock: stockItem?.stock ?? product.stock
    };
  });
};
