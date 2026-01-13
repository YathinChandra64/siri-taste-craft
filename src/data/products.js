import { getSareeImage } from './productImages';

export const sarees = [
  {
    id: 1,
    name: "Royal Silk Saree",
    category: "Silk",
    price: 4999,
    stock: 15,
    description: "Exquisite pure silk saree with traditional zari work. Perfect for weddings and special occasions.",
    image: getSareeImage("silk")
  },
  {
    id: 2,
    name: "Designer Cotton Saree",
    category: "Cotton",
    price: 1999,
    stock: 20,
    description: "Comfortable cotton saree with elegant prints. Ideal for everyday elegance.",
    image: getSareeImage("cotton")
  },
  {
    id: 3,
    name: "Banarasi Silk Saree",
    category: "Silk",
    price: 7999,
    stock: 10,
    description: "Authentic Banarasi silk with intricate brocade work. A timeless classic.",
    image: getSareeImage("silk")
  },
  {
    id: 4,
    name: "Printed Cotton Saree",
    category: "Cotton",
    price: 1499,
    stock: 25,
    description: "Vibrant printed cotton saree with beautiful color combinations.",
    image: getSareeImage("cotton")
  },
  {
    id: 5,
    name: "Wedding Designer Saree",
    category: "Designer",
    price: 12999,
    stock: 8,
    description: "Stunning designer saree with heavy embellishments and stonework.",
    image: getSareeImage("designer")
  },
  {
    id: 6,
    name: "Party Wear Designer Saree",
    category: "Designer",
    price: 8999,
    stock: 12,
    description: "Contemporary designer saree perfect for parties and celebrations.",
    image: getSareeImage("designer")
  },
  {
    id: 7,
    name: "Tussar Silk Saree",
    category: "Silk",
    price: 5499,
    stock: 18,
    description: "Natural tussar silk with elegant drape and rich texture.",
    image: getSareeImage("silk")
  },
  {
    id: 8,
    name: "Handloom Cotton Saree",
    category: "Cotton",
    price: 2499,
    stock: 22,
    description: "Traditional handloom cotton saree supporting local artisans.",
    image: getSareeImage("cotton")
  }
];

export const categories = {
  sarees: ["All", "Silk", "Cotton", "Designer"]
};
