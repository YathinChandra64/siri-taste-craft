import { getSareeImage, getPickleImage } from './productImages';

export const sarees = [
  {
    id: 1,
    name: "Royal Silk Saree",
    category: "Silk",
    price: 4999,
    description: "Exquisite pure silk saree with traditional zari work. Perfect for weddings and special occasions.",
    image: getSareeImage("silk")
  },
  {
    id: 2,
    name: "Designer Cotton Saree",
    category: "Cotton",
    price: 1999,
    description: "Comfortable cotton saree with elegant prints. Ideal for everyday elegance.",
    image: getSareeImage("cotton")
  },
  {
    id: 3,
    name: "Banarasi Silk Saree",
    category: "Silk",
    price: 7999,
    description: "Authentic Banarasi silk with intricate brocade work. A timeless classic.",
    image: getSareeImage("silk")
  },
  {
    id: 4,
    name: "Printed Cotton Saree",
    category: "Cotton",
    price: 1499,
    description: "Vibrant printed cotton saree with beautiful color combinations.",
    image: getSareeImage("cotton")
  },
  {
    id: 5,
    name: "Wedding Designer Saree",
    category: "Designer",
    price: 12999,
    description: "Stunning designer saree with heavy embellishments and stonework.",
    image: getSareeImage("designer")
  },
  {
    id: 6,
    name: "Party Wear Designer Saree",
    category: "Designer",
    price: 8999,
    description: "Contemporary designer saree perfect for parties and celebrations.",
    image: getSareeImage("designer")
  },
  {
    id: 7,
    name: "Tussar Silk Saree",
    category: "Silk",
    price: 5499,
    description: "Natural tussar silk with elegant drape and rich texture.",
    image: getSareeImage("silk")
  },
  {
    id: 8,
    name: "Handloom Cotton Saree",
    category: "Cotton",
    price: 2499,
    description: "Traditional handloom cotton saree supporting local artisans.",
    image: getSareeImage("cotton")
  }
];

export const pickles = [
  {
    id: 1,
    name: "Mango Pickle",
    category: "Mango",
    price: 299,
    description: "Traditional homemade mango pickle with authentic spices. A family recipe passed down through generations.",
    image: getPickleImage("mango")
  },
  {
    id: 2,
    name: "Lemon Pickle",
    category: "Lemon",
    price: 249,
    description: "Tangy lemon pickle made with fresh lemons and aromatic spices.",
    image: getPickleImage("lemon")
  },
  {
    id: 3,
    name: "Garlic Pickle",
    category: "Garlic",
    price: 329,
    description: "Spicy garlic pickle perfect for adding flavor to any meal.",
    image: getPickleImage("garlic")
  },
  {
    id: 4,
    name: "Mixed Vegetable Pickle",
    category: "Mixed",
    price: 279,
    description: "A delightful mix of seasonal vegetables pickled to perfection.",
    image: getPickleImage("mixed")
  },
  {
    id: 5,
    name: "Ginger Pickle",
    category: "Ginger",
    price: 269,
    description: "Zesty ginger pickle with a perfect balance of heat and tang.",
    image: getPickleImage("garlic")
  },
  {
    id: 6,
    name: "Red Chilli Pickle",
    category: "Chilli",
    price: 289,
    description: "Fiery red chilli pickle for spice lovers.",
    image: getPickleImage("garlic")
  },
  {
    id: 7,
    name: "Sweet Mango Pickle",
    category: "Mango",
    price: 319,
    description: "Sweet and tangy mango pickle with jaggery and spices.",
    image: getPickleImage("mango")
  },
  {
    id: 8,
    name: "Lime Pickle",
    category: "Lemon",
    price: 259,
    description: "Classic lime pickle with traditional tempering.",
    image: getPickleImage("lemon")
  }
];

export const categories = {
  sarees: ["All", "Silk", "Cotton", "Designer"],
  pickles: ["All", "Mango", "Lemon", "Garlic", "Mixed", "Ginger", "Chilli"]
};
