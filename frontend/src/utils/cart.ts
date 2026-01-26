// ✅ FIXED: Define proper types with MongoDB ObjectId strings

interface CartItem {
  id: string; // ✅ FIXED: Changed from number to string (MongoDB ObjectId)
  name: string;
  price: number;
  pricePerKg?: number;
  image: string;
  type: "saree" | "sweet";
  unit?: string;
  quantity: number;
}

interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// User-specific cart key based on logged-in user
const getCartKey = (): string => {
  try {
    const userJson = localStorage.getItem("user");
    if (!userJson) {
      return "cart_guest";
    }
    const user: StoredUser = JSON.parse(userJson);
    return `cart_${user.id || "guest"}`;
  } catch {
    return "cart_guest";
  }
};

export const getCart = (): CartItem[] => {
  try {
    const cartKey = getCartKey();
    const cart = localStorage.getItem(cartKey);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

export const addToCart = (
  item: {
    id: string; // ✅ FIXED: Changed from number to string (MongoDB ObjectId)
    name: string;
    price: number;
    image: string;
    type: "saree" | "sweet";
    unit?: string;
    quantity?: number;
  },
  quantity: number = 1
): boolean => {
  try {
    const cartKey = getCartKey();
    const cart = getCart();
    
    // ✅ FIX: Check if item already exists, merge quantities instead of duplicating
    const existingItemIndex: number = cart.findIndex(
      (cartItem: CartItem) => cartItem.id === item.id && cartItem.type === item.type
    );

    if (existingItemIndex > -1) {
      // Item exists, increase quantity
      cart[existingItemIndex].quantity += quantity;
    } else {
      // New item
      const newItem: CartItem = {
        ...item,
        quantity: quantity || 1,
        pricePerKg: item.type === "sweet" ? item.price : undefined
      };
      cart.push(newItem);
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    return true;
  } catch {
    return false;
  }
};

export const removeFromCart = (id: string, type: "saree" | "sweet"): boolean => {
  try {
    const cartKey = getCartKey();
    const cart = getCart();
    const filtered: CartItem[] = cart.filter(
      (item: CartItem) => !(item.id === id && item.type === type)
    );
    localStorage.setItem(cartKey, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

export const updateCartQuantity = (
  id: string,
  type: "saree" | "sweet",
  quantity: number
): boolean => {
  try {
    const cartKey = getCartKey();
    const cart = getCart();
    const item: CartItem | undefined = cart.find(
      (i: CartItem) => i.id === id && i.type === type
    );
    
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    return true;
  } catch {
    return false;
  }
};

export const getCartTotal = (): number => {
  try {
    const cart = getCart();
    return cart.reduce(
      (total: number, item: CartItem) =>
        total + ((item.pricePerKg || item.price || 0) * (item.quantity || 1)),
      0
    );
  } catch {
    return 0;
  }
};

export const clearCart = (): boolean => {
  try {
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
    return true;
  } catch {
    return false;
  }
};