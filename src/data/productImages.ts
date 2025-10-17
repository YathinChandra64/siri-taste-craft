// Import all product images
import sareeSilk from "@/assets/saree-silk.jpg";
import sareeCotton from "@/assets/saree-cotton.jpg";
import sareeDesigner from "@/assets/saree-designer.jpg";
import sweetLadoo from "@/assets/sweet-ladoo.jpg";
import sweetBarfi from "@/assets/sweet-barfi.jpg";
import sweetGulab from "@/assets/sweet-gulab.jpg";
import sweetMysore from "@/assets/sweet-mysore.jpg";

export const sareeImages: Record<string, string> = {
  silk: sareeSilk,
  cotton: sareeCotton,
  designer: sareeDesigner,
};

export const sweetImages: Record<string, string> = {
  ladoo: sweetLadoo,
  barfi: sweetBarfi,
  gulab: sweetGulab,
  mysore: sweetMysore,
};

// Helper function to get image by category
export const getSareeImage = (category: string): string => {
  return sareeImages[category.toLowerCase()] || sareeSilk;
};

export const getSweetImage = (category: string): string => {
  return sweetImages[category.toLowerCase()] || sweetLadoo;
};
