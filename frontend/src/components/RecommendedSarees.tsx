import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Star, Heart } from 'lucide-react';

interface Saree {
  _id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  averageRating?: number;
  reviewCount?: number;
  fabric?: string;
  tags?: string[];
}

interface RecommendedSareesProps {
  currentSaree: Saree;
  category?: string;
  fabric?: string;
  priceRange?: [number, number];
  tags?: string[];
}

const RecommendedSarees: React.FC<RecommendedSareesProps> = ({
  currentSaree,
  category,
  fabric,
  priceRange,
  tags = [],
}) => {
  const navigate = useNavigate();
  const [recommendedSarees, setRecommendedSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  useEffect(() => {
    fetchRecommendations();
    loadWishlist();
  }, [currentSaree._id, category, fabric]);

  const loadWishlist = () => {
    try {
      const wishlist = localStorage.getItem('wishlist');
      if (wishlist) {
        const items = JSON.parse(wishlist) as Array<{ id: string; name: string; price: number; image: string; category: string }>;
        setWishlistItems(items.map((item) => item.id));
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  const toggleWishlist = (sareeId: string) => {
    try {
      const wishlist = localStorage.getItem('wishlist');
      const wishlistItems = wishlist ? (JSON.parse(wishlist) as Array<{ id: string; name: string; price: number; image: string; category: string }>) : [];
      const isWishlisted = wishlistItems.some((item) => item.id === sareeId);

      if (isWishlisted) {
        const filtered = wishlistItems.filter((item) => item.id !== sareeId);
        localStorage.setItem('wishlist', JSON.stringify(filtered));
        setWishlistItems(filtered.map((item) => item.id));
      } else {
        const saree = recommendedSarees.find(s => s._id === sareeId);
        if (saree) {
          wishlistItems.push({
            id: saree._id,
            name: saree.name,
            price: saree.price,
            image: saree.imageUrl,
            category: saree.category,
          });
          localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
          setWishlistItems([...wishlistItems.map((item) => item.id), sareeId]);
        }
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (fabric) params.append('fabric', fabric);
      if (priceRange) {
        params.append('minPrice', priceRange[0].toString());
        params.append('maxPrice', priceRange[1].toString());
      }
      if (tags.length > 0) {
        params.append('tags', tags.join(','));
      }
      params.append('exclude', currentSaree._id);
      params.append('limit', '8');

      const response = await fetch(
        `http://localhost:5000/api/sarees/recommendations?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        const sareesData = Array.isArray(data) ? data : (data.data || []);
        setRecommendedSarees(sareesData.slice(0, 8));
      } else {
        const fallbackResponse = await fetch(
          `http://localhost:5000/api/sarees?category=${category}&limit=8`
        );
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackSarees = (Array.isArray(fallbackData) 
            ? fallbackData 
            : (fallbackData.data || [])) as Saree[];
          
          const filtered = fallbackSarees.filter(
            (saree: Saree) => saree._id !== currentSaree._id
          );
          setRecommendedSarees(filtered.slice(0, 8));
        }
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < Math.floor(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-16 space-y-8">
        <h2 className="text-2xl md:text-3xl font-bold">You May Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="space-y-3">
              <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-xl animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendedSarees.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="py-16 space-y-8 border-t"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold">You May Also Like</h2>
        <motion.button
          onClick={() => navigate('/sarees')}
          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          whileHover={{ x: 5 }}
        >
          View All →
        </motion.button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {recommendedSarees.map((saree, index) => {
            const isWishlisted = wishlistItems.includes(saree._id);
            return (
              <motion.div
                key={saree._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="overflow-hidden group rounded-2xl border border-gray-200 dark:border-0 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col bg-white dark:bg-slate-900"
                  onClick={() => navigate(`/sarees/${saree._id}`)}
                >
                  {/* Image Container */}
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 relative">
                    <img
                      src={saree.imageUrl}
                      alt={saree.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Wishlist Button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(saree._id);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-0"
                    >
                      <Heart
                        size={18}
                        className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}
                      />
                    </motion.button>

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-0">
                        {saree.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                      {saree.name}
                    </h3>

                    {/* Rating & Reviews */}
                    {saree.averageRating && saree.reviewCount ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {renderStars(saree.averageRating)}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          ({saree.reviewCount})
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No reviews</p>
                    )}

                    {/* Fabric */}
                    {saree.fabric && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {saree.fabric}
                      </p>
                    )}

                    {/* Price */}
                    <div className="pt-2 border-t">
                      <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        ₹{saree.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RecommendedSarees;