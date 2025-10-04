// Import all product images
import sareeSilk from "@/assets/saree-silk.jpg";
import sareeCotton from "@/assets/saree-cotton.jpg";
import sareeDesigner from "@/assets/saree-designer.jpg";
import pickleMango from "@/assets/pickle-mango.jpg";
import pickleLemon from "@/assets/pickle-lemon.jpg";
import pickleGarlic from "@/assets/pickle-garlic.jpg";
import pickleMixed from "@/assets/pickle-mixed.jpg";

export const sareeImages: Record<string, string> = {
  silk: sareeSilk,
  cotton: sareeCotton,
  designer: sareeDesigner,
};

export const pickleImages: Record<string, string> = {
  mango: pickleMango,
  lemon: pickleLemon,
  garlic: pickleGarlic,
  mixed: pickleMixed,
};

// Helper function to get image by category
export const getSareeImage = (category: string): string => {
  return sareeImages[category.toLowerCase()] || sareeSilk;
};

export const getPickleImage = (category: string): string => {
  return pickleImages[category.toLowerCase()] || pickleMango;
};
