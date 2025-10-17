import { getSareeImage, getSweetImage } from './productImages';

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

export const sweets = [
  {
    id: 1,
    name: "Besan Ladoo",
    category: "Ladoo",
    price: 399,
    stock: 50,
    description: "Traditional homemade besan ladoo made with pure ghee and authentic spices. A family recipe passed down through generations.",
    image: getSweetImage("ladoo")
  },
  {
    id: 2,
    name: "Kaju Barfi",
    category: "Barfi",
    price: 599,
    stock: 45,
    description: "Rich cashew barfi with silver leaf, perfect for gifting on special occasions.",
    image: getSweetImage("barfi")
  },
  {
    id: 3,
    name: "Gulab Jamun",
    category: "Gulab",
    price: 329,
    stock: 60,
    description: "Soft and spongy gulab jamun soaked in aromatic sugar syrup.",
    image: getSweetImage("gulab")
  },
  {
    id: 4,
    name: "Mysore Pak",
    category: "Mysore",
    price: 449,
    stock: 40,
    description: "Traditional Mysore pak with perfect ghee texture and sweetness.",
    image: getSweetImage("mysore")
  },
  {
    id: 5,
    name: "Coconut Ladoo",
    category: "Ladoo",
    price: 349,
    stock: 55,
    description: "Fresh coconut ladoo with cardamom and condensed milk.",
    image: getSweetImage("ladoo")
  },
  {
    id: 6,
    name: "Pista Barfi",
    category: "Barfi",
    price: 649,
    stock: 35,
    description: "Premium pistachio barfi with a melt-in-mouth texture.",
    image: getSweetImage("barfi")
  },
  {
    id: 7,
    name: "Kala Jamun",
    category: "Gulab",
    price: 359,
    stock: 48,
    description: "Rich dark jamuns with a unique flavor profile and soft texture.",
    image: getSweetImage("gulab")
  },
  {
    id: 8,
    name: "Milk Mysore Pak",
    category: "Mysore",
    price: 479,
    stock: 38,
    description: "Special milk-based Mysore pak with authentic taste.",
    image: getSweetImage("mysore")
  }
];

export const categories = {
  sarees: ["All", "Silk", "Cotton", "Designer"],
  sweets: ["All", "Ladoo", "Barfi", "Gulab", "Mysore"]
};
