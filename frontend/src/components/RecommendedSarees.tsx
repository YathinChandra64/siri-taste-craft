import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';

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

  useEffect(() => {
    fetchRecommendations();
  }, [currentSaree._id, category, fabric]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // Build query parameters for recommendation logic
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
        setRecommendedSarees(sareesData);
      } else {
        // Fallback: get random sarees from same category
        const fallbackResponse = await fetch(
          `http://localhost:5000/api/sarees?category=${category}&limit=8`
        );
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackSarees = Array.isArray(fallbackData) 
            ? fallbackData 
            : (fallbackData.data || []);
          
          // Filter out current saree
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
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-6">Recommended for You</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
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
      className="py-12 border-t"
    >
      <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recommendedSarees.map((saree, index) => (
          <motion.div
            key={saree._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/sarees/${saree._id}`)}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={saree.imageUrl}
                  alt={saree.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {saree.name}
                </h3>
                
                {saree.averageRating && saree.reviewCount ? (
                  <div className="flex items-center gap-2">
                    {renderStars(saree.averageRating)}
                    <span className="text-xs text-muted-foreground">
                      ({saree.reviewCount})
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No reviews yet</p>
                )}
                
                <p className="text-lg font-bold bg-gradient-saree bg-clip-text text-transparent">
                  ₹{saree.price.toLocaleString()}
                </p>
                
                {saree.fabric && (
                  <p className="text-xs text-muted-foreground">
                    {saree.fabric}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecommendedSarees;