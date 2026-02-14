import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { colors } from "@/design/colors";

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
    <div style={{ borderBottom: `1px solid ${colors.bg.border}` }}>
      <button
        onClick={() => toggleSection(id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          color: colors.accent.gold,
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = colors.accent.goldBright;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = colors.accent.gold;
        }}
      >
        <h3>{title}</h3>
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
        style={{ overflow: 'hidden' }}
      >
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: colors.bg.primary,
        borderRight: `1px solid ${colors.bg.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${colors.bg.border}`,
      }}
    >
      {/* Clear All Button */}
      <div style={{ padding: '16px' }}>
        <button
          onClick={clearAllFilters}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: `rgba(255, 107, 107, 0.1)`,
            border: `1px solid ${colors.accent.red}`,
            borderRadius: '4px',
            color: colors.accent.red,
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `rgba(255, 107, 107, 0.2)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `rgba(255, 107, 107, 0.1)`;
          }}
        >
          Clear All Filters
        </button>
      </div>

      {/* Active Filters Count */}
      {activeFilterCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: '0 16px 16px',
            padding: '12px',
            backgroundColor: `rgba(147, 51, 234, 0.1)`,
            border: `1px solid rgba(147, 51, 234, 0.3)`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: '500', color: colors.text.primary }}>
            {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
          </span>
        </motion.div>
      )}

      {/* Sort */}
      <FilterSection title="Sort By" id="sort">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { value: "newest", label: "Newest Arrivals" },
            { value: "price-low", label: "Price: Low to High" },
            { value: "price-high", label: "Price: High to Low" },
            { value: "rating", label: "Top Rated" },
          ].map((option) => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={filters.sortBy === option.value}
                onChange={() => handleSortChange(option.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: colors.accent.gold,
                }}
              />
              <span style={{ fontSize: '14px', color: colors.text.primary }}>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" id="price">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={filters.priceRange[0]}
              onChange={(e) =>
                handlePriceChange([Number(e.target.value), filters.priceRange[1]])
              }
              style={{
                width: '100%',
                height: '2px',
                background: `linear-gradient(to right, ${colors.accent.gold}, ${colors.accent.purple})`,
                borderRadius: '1px',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.text.secondary, marginTop: '8px' }}>
              <span>₹{minPrice.toLocaleString()}</span>
              <span>₹{maxPrice.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange[0]}
              onChange={(e) =>
                handlePriceChange([Number(e.target.value), filters.priceRange[1]])
              }
              style={{
                width: '50%',
                padding: '8px',
                backgroundColor: colors.bg.tertiary,
                border: `1px solid ${colors.bg.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                color: colors.text.primary,
              }}
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange[1]}
              onChange={(e) =>
                handlePriceChange([filters.priceRange[0], Number(e.target.value)])
              }
              style={{
                width: '50%',
                padding: '8px',
                backgroundColor: colors.bg.tertiary,
                border: `1px solid ${colors.bg.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                color: colors.text.primary,
              }}
            />
          </div>
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" id="category">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map((cat) => (
            <label
              key={cat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: colors.accent.gold,
                  borderRadius: '4px',
                }}
              />
              <span style={{ fontSize: '14px', color: colors.text.primary }}>{cat}</span>
              <span style={{ fontSize: '12px', color: colors.text.secondary, marginLeft: 'auto' }}>
                ({sarees.filter((s) => s.category === cat).length})
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Material */}
      {uniqueMaterials.length > 0 && (
        <FilterSection title="Material" id="material">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uniqueMaterials.map((material) => (
              <label
                key={material}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.tertiary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.materials.includes(material)}
                  onChange={() => handleMaterialChange(material)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: colors.accent.gold,
                    borderRadius: '4px',
                  }}
                />
                <span style={{ fontSize: '14px', color: colors.text.primary }}>{material}</span>
                <span style={{ fontSize: '12px', color: colors.text.secondary, marginLeft: 'auto' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uniqueOccasions.map((occasion) => (
              <label
                key={occasion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.tertiary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.occasions.includes(occasion)}
                  onChange={() => handleOccasionChange(occasion)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: colors.accent.gold,
                    borderRadius: '4px',
                  }}
                />
                <span style={{ fontSize: '14px', color: colors.text.primary }}>{occasion}</span>
                <span style={{ fontSize: '12px', color: colors.text.secondary, marginLeft: 'auto' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {uniqueColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: filters.colors.includes(color)
                    ? colors.accent.gold
                    : colors.bg.tertiary,
                  color: filters.colors.includes(color)
                    ? colors.bg.primary
                    : colors.text.primary,
                  border: filters.colors.includes(color)
                    ? `2px solid ${colors.accent.goldBright}`
                    : `1px solid ${colors.bg.border}`,
                }}
              >
                {color}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Availability */}
      <FilterSection title="Availability" id="availability">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { value: "in-stock", label: "In Stock" },
            { value: "out-of-stock", label: "Out of Stock" },
          ].map((option) => (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="checkbox"
                checked={filters.availability.includes(option.value)}
                onChange={() => handleAvailabilityChange(option.value)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: colors.accent.gold,
                  borderRadius: '4px',
                }}
              />
              <span style={{ fontSize: '14px', color: colors.text.primary }}>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating" id="rating">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 4, 4.5, 5].map((rating) => (
            <label
              key={rating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating}
                onChange={() => handleRatingChange(rating)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: colors.accent.gold,
                }}
              />
              <span style={{ fontSize: '14px', color: colors.text.primary }}>
                {rating === 0 ? "All Ratings" : `${rating}⭐ & above`}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default SareeFilters;