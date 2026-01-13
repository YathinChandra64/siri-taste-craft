import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Filter, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface FilterOptions {
  category: string;
  priceRange: [number, number];
  sortBy: string;
  texture?: string;
  occasion?: string;
  sweetType?: string;
}

interface AdvancedFilterBarProps {
  products: any[];
  type: "saree" | "sweet";
  onFilterChange: (filtered: any[]) => void;
}

const AdvancedFilterBar = ({ products, type, onFilterChange }: AdvancedFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: "All",
    priceRange: [0, 15000],
    sortBy: "default",
    texture: "All",
    occasion: "All",
    sweetType: "All",
  });

  // Generate dynamic categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category))) as string[];
    return ["All", ...uniqueCategories];
  }, [products]);

  const priceRange = useMemo(() => {
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, [products]);

  const textures = type === "saree" ? ["All", "Silk", "Cotton", "Chiffon", "Georgette", "Linen"] : [];
  const occasions = type === "saree" ? ["All", "Wedding", "Party", "Casual", "Festival", "Office"] : [];
  const sweetTypes = type === "sweet" ? ["All", "Dry", "Syrup-based", "Milk-based", "Nut-based"] : [];

  const sortOptions = [
    { value: "default", label: "Default" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
  ];

  const applyFilters = () => {
    let filtered = [...products];

    // Category filter
    if (filters.category !== "All") {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Price range filter
    filtered = filtered.filter(
      p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    onFilterChange(filtered);
  };

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      category: "All",
      priceRange: priceRange,
      sortBy: "default",
      texture: "All",
      occasion: "All",
      sweetType: "All",
    });
    onFilterChange(products);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== "All") count++;
    if (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]) count++;
    if (filters.sortBy !== "default") count++;
    if (filters.texture !== "All") count++;
    if (filters.occasion !== "All") count++;
    if (filters.sweetType !== "All") count++;
    return count;
  }, [filters, priceRange]);

  const gradientClass = type === "saree" ? "bg-gradient-saree" : "bg-gradient-sweet";

  return (
    <div className="mb-8">
      {/* Filter Toggle Button */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant="outline"
            className="gap-2 relative"
          >
            <SlidersHorizontal size={18} />
            Filters
            {activeFilterCount > 0 && (
              <Badge className={`${gradientClass} text-white ml-1`}>
                {activeFilterCount}
              </Badge>
            )}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </Button>
        </motion.div>

        {/* Quick Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                updateFilter("category", category);
                setTimeout(applyFilters, 0);
              }}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                filters.category === category
                  ? `${gradientClass} text-white shadow-lg`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {activeFilterCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
            Clear all
          </motion.button>
        )}
      </div>

      {/* Expanded Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-card">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Filter size={14} />
                    Price Range
                  </label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
                      max={priceRange[1]}
                      min={priceRange[0]}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>₹{filters.priceRange[0]}</span>
                      <span>₹{filters.priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Sort By</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {sortOptions.find(o => o.value === filters.sortBy)?.label}
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-popover">
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => updateFilter("sortBy", option.value)}
                          className={filters.sortBy === option.value ? "bg-muted" : ""}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Texture (Sarees only) */}
                {type === "saree" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Texture</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {filters.texture}
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48 bg-popover">
                        {textures.map((texture) => (
                          <DropdownMenuItem
                            key={texture}
                            onClick={() => updateFilter("texture", texture)}
                            className={filters.texture === texture ? "bg-muted" : ""}
                          >
                            {texture}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Occasion (Sarees only) */}
                {type === "saree" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Occasion</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {filters.occasion}
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48 bg-popover">
                        {occasions.map((occasion) => (
                          <DropdownMenuItem
                            key={occasion}
                            onClick={() => updateFilter("occasion", occasion)}
                            className={filters.occasion === occasion ? "bg-muted" : ""}
                          >
                            {occasion}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Sweet Type (Sweets only) */}
                {type === "sweet" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Sweet Type</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {filters.sweetType}
                          <ChevronDown size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48 bg-popover">
                        {sweetTypes.map((sweetType) => (
                          <DropdownMenuItem
                            key={sweetType}
                            onClick={() => updateFilter("sweetType", sweetType)}
                            className={filters.sweetType === sweetType ? "bg-muted" : ""}
                          >
                            {sweetType}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <div className="flex justify-end">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={applyFilters}
                    className={`${gradientClass} text-white px-8`}
                  >
                    Apply Filters
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilterBar;
