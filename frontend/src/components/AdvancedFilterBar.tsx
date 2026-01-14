import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Filter, ChevronDown, X, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface FilterOptions {
  category: string;
  priceRange: [number, number];
  sortBy: string;
  texture?: string;
  occasion?: string;
}

interface AdvancedFilterBarProps {
  products: any[];
  type: "saree";
  onFilterChange: (filtered: any[]) => void;
}

const AdvancedFilterBar = ({ products, type, onFilterChange }: AdvancedFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const priceRange = useMemo(() => {
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, [products]);

  const [filters, setFilters] = useState<FilterOptions>({
    category: "All",
    priceRange: priceRange,
    sortBy: "default",
    texture: "All",
    occasion: "All",
  });

  // Generate dynamic categories from products
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category))) as string[];
    return ["All", ...uniqueCategories];
  }, [products]);

  const textures = ["All", "Silk", "Cotton", "Chiffon", "Georgette", "Linen", "Tussar"];
  const occasions = ["All", "Wedding", "Party", "Casual", "Festival", "Office", "Daily Wear"];

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

  // Auto-apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [filters]);

  const updateFilter = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "All",
      priceRange: priceRange,
      sortBy: "default",
      texture: "All",
      occasion: "All",
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== "All") count++;
    if (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]) count++;
    if (filters.sortBy !== "default") count++;
    if (filters.texture !== "All") count++;
    if (filters.occasion !== "All") count++;
    return count;
  }, [filters, priceRange]);

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
            className="gap-2 relative bg-gradient-saree text-white hover:opacity-90 shadow-lg"
          >
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <SlidersHorizontal size={18} />
            </motion.div>
            <span className="font-semibold">Filters</span>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-1"
              >
                <Badge className="bg-white text-primary px-2 py-0.5 text-xs font-bold">
                  {activeFilterCount}
                </Badge>
              </motion.div>
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
          {categories.map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateFilter("category", category)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 relative overflow-hidden ${
                filters.category === category
                  ? "bg-gradient-saree text-white shadow-lg"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border hover:border-primary/50"
              }`}
            >
              {filters.category === category && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-gradient-saree -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                {category}
                {filters.category === category && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Sparkles size={12} />
                  </motion.div>
                )}
              </span>
            </motion.button>
          ))}
        </div>

        {activeFilterCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-full border border-border hover:border-destructive/50"
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
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <motion.div 
              className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-card"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Price Range */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Filter size={14} className="text-primary" />
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
                      <motion.span 
                        className="bg-primary/10 px-2 py-1 rounded-full font-medium text-primary"
                        key={filters.priceRange[0]}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        ₹{filters.priceRange[0].toLocaleString()}
                      </motion.span>
                      <motion.span 
                        className="bg-primary/10 px-2 py-1 rounded-full font-medium text-primary"
                        key={filters.priceRange[1]}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                      >
                        ₹{filters.priceRange[1].toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>

                {/* Sort By */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="text-sm font-medium text-foreground">Sort By</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between hover:border-primary/50 transition-colors">
                        {sortOptions.find(o => o.value === filters.sortBy)?.label}
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-popover border border-border shadow-lg">
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => updateFilter("sortBy", option.value)}
                          className={`cursor-pointer transition-colors ${
                            filters.sortBy === option.value 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "hover:bg-muted"
                          }`}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>

                {/* Texture */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="text-sm font-medium text-foreground">Texture</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between hover:border-primary/50 transition-colors">
                        {filters.texture}
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-popover border border-border shadow-lg">
                      {textures.map((texture) => (
                        <DropdownMenuItem
                          key={texture}
                          onClick={() => updateFilter("texture", texture)}
                          className={`cursor-pointer transition-colors ${
                            filters.texture === texture 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "hover:bg-muted"
                          }`}
                        >
                          {texture}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>

                {/* Occasion */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="text-sm font-medium text-foreground">Occasion</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between hover:border-primary/50 transition-colors">
                        {filters.occasion}
                        <ChevronDown size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-popover border border-border shadow-lg">
                      {occasions.map((occasion) => (
                        <DropdownMenuItem
                          key={occasion}
                          onClick={() => updateFilter("occasion", occasion)}
                          className={`cursor-pointer transition-colors ${
                            filters.occasion === occasion 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "hover:bg-muted"
                          }`}
                        >
                          {occasion}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              </div>

              {/* Results indicator */}
              <motion.div 
                className="flex justify-between items-center pt-4 border-t border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm text-muted-foreground">
                  Filters apply automatically as you select
                </p>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles size={16} className="text-primary" />
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilterBar;
