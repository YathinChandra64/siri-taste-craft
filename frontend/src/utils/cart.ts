// Cart utility functions with stock validation

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  type: 'saree' | 'blouse' | 'fabric';
  quantity: number;
  selectedColor?: string;
  stock?: number;
}

const CART_STORAGE_KEY = 'cart';

export const getCart = (): CartItem[] => {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error reading cart:', error);
    return [];
  }
};

export const addToCart = (item: CartItem): boolean => {
  try {
    const cart = getCart();
    
    // Check if item already exists in cart (considering color variant)
    const existingItemIndex = cart.findIndex(
      (cartItem) => 
        cartItem.id === item.id && 
        cartItem.selectedColor === item.selectedColor
    );

    if (existingItemIndex > -1) {
      // Update quantity of existing item
      const newQuantity = cart[existingItemIndex].quantity + item.quantity;
      
      // Validate against stock if available
      if (item.stock && newQuantity > item.stock) {
        console.error(`Cannot add to cart: Only ${item.stock} items available`);
        return false;
      }
      
      cart[existingItemIndex].quantity = newQuantity;
    } else {
      // Validate quantity against stock
      if (item.stock && item.quantity > item.stock) {
        console.error(`Cannot add to cart: Only ${item.stock} items available`);
        return false;
      }
      
      // Add new item
      cart.push(item);
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

export const updateCartItemQuantity = (
  itemId: string,
  quantity: number,
  selectedColor?: string
): boolean => {
  try {
    const cart = getCart();
    const itemIndex = cart.findIndex(
      (item) => item.id === itemId && item.selectedColor === selectedColor
    );

    if (itemIndex === -1) {
      return false;
    }

    // Validate against stock
    if (cart[itemIndex].stock && quantity > cart[itemIndex].stock) {
      console.error(`Cannot update quantity: Only ${cart[itemIndex].stock} items available`);
      return false;
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = quantity;
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    return false;
  }
};

export const removeFromCart = (itemId: string, selectedColor?: string): void => {
  try {
    const cart = getCart();
    const updatedCart = cart.filter(
      (item) => !(item.id === itemId && item.selectedColor === selectedColor)
    );
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
};

export const clearCart = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};

export const getCartTotal = (): number => {
  try {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return 0;
  }
};

export const getCartItemCount = (): number => {
  try {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
};

interface ColorVariantResponse {
  color: string;
  colorCode: string;
  images: string[];
  stock: number;
}

interface SareeResponse {
  stock: number;
  colorVariants?: ColorVariantResponse[];
  data?: {
    stock: number;
    colorVariants?: ColorVariantResponse[];
  };
}

export const validateCartStock = async (): Promise<{
  valid: boolean;
  errors: string[];
}> => {
  try {
    const cart = getCart();
    const errors: string[] = [];

    // Validate each item against current stock
    for (const item of cart) {
      try {
        const response = await fetch(`http://localhost:5000/api/sarees/${item.id}`);
        if (response.ok) {
          const saree: SareeResponse = await response.json();
          const sareeData = saree.data || saree;
          
          let availableStock = sareeData.stock;
          
          // Check color variant stock if applicable
          if (item.selectedColor && sareeData.colorVariants) {
            const variant = sareeData.colorVariants.find(
              (v: ColorVariantResponse) => v.color === item.selectedColor
            );
            if (variant) {
              availableStock = variant.stock;
            }
          }

          if (item.quantity > availableStock) {
            errors.push(
              `${item.name}${item.selectedColor ? ` (${item.selectedColor})` : ''}: Only ${availableStock} items available`
            );
          }

          if (availableStock === 0) {
            errors.push(
              `${item.name}${item.selectedColor ? ` (${item.selectedColor})` : ''} is out of stock`
            );
          }
        }
      } catch (error) {
        console.error(`Error validating stock for item ${item.id}:`, error);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('Error validating cart stock:', error);
    return {
      valid: false,
      errors: ['Failed to validate cart stock'],
    };
  }
};