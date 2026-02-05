import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Saree = {
  _id: string;
  name: string;
  price: number;
  category: string;
  material?: string;
  color?: string;
  occasion?: string;
};

type FilterState = {
  priceRange: [number, number];
  categories: string[];
  materials: string[];
  occasions: string[];
  colors: string[];
  availability: string[];
  minRating: number;
  sortBy: string;
};

interface SareeFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  sarees: Saree[];
}

const SareeFilters = ({ filters, onFilterChange, sarees }: SareeFiltersProps) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    material: false,
    occasion: false,
    color: false,
    availability: false,
    rating: false,
    sort: true,
  });

  // Extract unique values from sarees
  const uniqueMaterials = [...new Set(sarees.map((s) => s.material).filter(Boolean))];
  const uniqueOccasions = [...new Set(sarees.map((s) => s.occasion).filter(Boolean))];
  const uniqueColors = [...new Set(sarees.map((s) => s.color).filter(Boolean))];
  const categories = ["Silk", "Cotton", "Bridal", "Designer", "Casual", "Traditional"];

  const minPrice = Math.min(...sarees.map((s) => s.price), 1000);
  const maxPrice = Math.max(...sarees.map((s) => s.price), 100000);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePriceChange = (range: [number, number]) => {
    onFilterChange({ ...filters, priceRange: range });
  };

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleMaterialChange = (material: string) => {
    const newMaterials = filters.materials.includes(material)
      ? filters.materials.filter((m) => m !== material)
      : [...filters.materials, material];
    onFilterChange({ ...filters, materials: newMaterials });
  };

  const handleOccasionChange = (occasion: string) => {
    const newOccasions = filters.occasions.includes(occasion)
      ? filters.occasions.filter((o) => o !== occasion)
      : [...filters.occasions, occasion];
    onFilterChange({ ...filters, occasions: newOccasions });
  };

  const handleColorChange = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFilterChange({ ...filters, colors: newColors });
  };

  const handleAvailabilityChange = (availability: string) => {
    const newAvailability = filters.availability.includes(availability)
      ? filters.availability.filter((a) => a !== availability)
      : [...filters.availability, availability];
    onFilterChange({ ...filters, availability: newAvailability });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ ...filters, minRating: rating === filters.minRating ? 0 : rating });
  };

  const handleSortChange = (sortBy: string) => {
    onFilterChange({ ...filters, sortBy });
  };

  const activeFilterCount = [
    filters.categories.length,
    filters.materials.length,
    filters.occasions.length,
    filters.colors.length,
    filters.availability.length,
    filters.minRating > 0 ? 1 : 0,
    filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    onFilterChange({
      priceRange: [minPrice, maxPrice],
      categories: [],
      materials: [],
      occasions: [],
      colors: [],
      availability: [],
      minRating: 0,
      sortBy: "newest",
    });
  };

  const FilterSection = ({
    title,
    id,
    children,
  }: {
    title: string;
    id: keyof typeof expandedSections;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-border">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-semibold text-sm">{title}</h3>
        <motion.div
          animate={{ rotate: expandedSections[id] ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: expandedSections[id] ? "auto" : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 space-y-3">{children}</div>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Active Filters Badge */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"
        >
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
          </span>
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear All
          </button>
        </motion.div>
      )}

      {/* Sort */}
      <FilterSection title="Sort By" id="sort">
        <div className="space-y-2">
          {[
            { value: "newest", label: "Newest Arrivals" },
            { value: "price-low", label: "Price: Low to High" },
            { value: "price-high", label: "Price: High to Low" },
            { value: "rating", label: "Top Rated" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={filters.sortBy === option.value}
                onChange={() => handleSortChange(option.value)}
                className="w-4 h-4"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" id="price">
        <div className="space-y-4">
          <div>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={filters.priceRange[0]}
              onChange={(e) =>
                handlePriceChange([Number(e.target.value), filters.priceRange[1]])
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>₹{minPrice.toLocaleString()}</span>
              <span>₹{maxPrice.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0]}
              onChange={(e) =>
                handlePriceChange([Number(e.target.value), filters.priceRange[1]])
              }
              className="w-1/2 px-2 py-1 border border-input rounded text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1]}
              onChange={(e) =>
                handlePriceChange([filters.priceRange[0], Number(e.target.value)])
              }
              className="w-1/2 px-2 py-1 border border-input rounded text-sm"
            />
          </div>
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" id="category">
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">{cat}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                ({sarees.filter((s) => s.category === cat).length})
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Material */}
      {uniqueMaterials.length > 0 && (
        <FilterSection title="Material" id="material">
          <div className="space-y-2">
            {uniqueMaterials.map((material) => (
              <label key={material} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.materials.includes(material)}
                  onChange={() => handleMaterialChange(material)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">{material}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  ({sarees.filter((s) => s.material === material).length})
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Occasion */}
      {uniqueOccasions.length > 0 && (
        <FilterSection title="Occasion" id="occasion">
          <div className="space-y-2">
            {uniqueOccasions.map((occasion) => (
              <label key={occasion} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.occasions.includes(occasion)}
                  onChange={() => handleOccasionChange(occasion)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">{occasion}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  ({sarees.filter((s) => s.occasion === occasion).length})
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Color */}
      {uniqueColors.length > 0 && (
        <FilterSection title="Color" id="color">
          <div className="grid grid-cols-3 gap-2">
            {uniqueColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`py-2 px-2 rounded text-sm font-medium text-center transition-all ${
                  filters.colors.includes(color)
                    ? "bg-primary text-primary-foreground ring-2 ring-primary"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Availability */}
      <FilterSection title="Availability" id="availability">
        <div className="space-y-2">
          {[
            { value: "in-stock", label: "In Stock" },
            { value: "out-of-stock", label: "Out of Stock" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.availability.includes(option.value)}
                onChange={() => handleAvailabilityChange(option.value)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating" id="rating">
        <div className="space-y-2">
          {[0, 4, 4.5, 5].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating}
                onChange={() => handleRatingChange(rating)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                {rating === 0
                  ? "All Ratings"
                  : `${rating}⭐ & above`}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default SareeFilters;