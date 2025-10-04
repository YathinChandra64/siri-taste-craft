import { motion } from "framer-motion";

interface FilterBarProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  type: "saree" | "pickle";
}

const FilterBar = ({ categories, activeCategory, onCategoryChange, type }: FilterBarProps) => {
  const gradientClass = type === "saree" ? "bg-gradient-saree" : "bg-gradient-pickle";

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {categories.map((category) => (
        <motion.button
          key={category}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCategoryChange(category)}
          className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
            activeCategory === category
              ? `${gradientClass} text-white shadow-hover`
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
};

export default FilterBar;
