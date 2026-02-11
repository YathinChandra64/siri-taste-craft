import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AnimatedBackground from "@/components/AnimatedBackground";
import ImageMagnifier from "@/components/ImageMagnifier";
import RecommendedSarees from "@/components/RecommendedSarees";
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  MessageCircle,
  ChevronLeft,
  Check,
  Trash2,
} from "lucide-react";
import { addToCart, getCart } from "@/utils/cart";

// ✅ FIXED: Proper TypeScript interfaces (no 'any')
interface ColorVariant {
  color: string;
  colorCode: string;
  images: string[];
  stock: number;
}

interface Saree {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  description: string;
  material?: string;
  color?: string;
  occasion?: string;
  blousePrice?: number;
  length?: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  colorVariants?: ColorVariant[];
  fabric?: string;
  tags?: string[];
}

interface Review {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string;
  sareeId: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedBuyer: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  type: "saree";
  quantity: number;
  selectedColor?: string;
}

const SareeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // States
  const [saree, setSaree] = useState<Saree | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [userReview, setUserReview] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  // ✅ NEW: Color variant state
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  
  // ✅ NEW: Stock error state
  const [stockError, setStockError] = useState("");

  // Review form
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // ✅ NEW: Get current stock based on selected color variant
  const getCurrentStock = useCallback((): number => {
    if (!saree) return 0;
    
    if (saree.colorVariants && saree.colorVariants.length > 0) {
      return saree.colorVariants[selectedColorIndex]?.stock || 0;
    }
    
    return saree.stock || 0;
  }, [saree, selectedColorIndex]);

  // ✅ NEW: Get current images based on selected color variant
  const getCurrentImages = useCallback((): string[] => {
    if (!saree) return [];
    
    if (saree.colorVariants && saree.colorVariants.length > 0) {
      const variantImages = saree.colorVariants[selectedColorIndex]?.images;
      return variantImages && variantImages.length > 0 ? variantImages : [saree.imageUrl];
    }
    
    return [saree.imageUrl];
  }, [saree, selectedColorIndex]);

  // ✅ NEW: Handle quantity change with stock validation
  const handleQuantityChange = (newQuantity: number) => {
    const availableStock = getCurrentStock();
    
    if (newQuantity < 1) {
      setQuantity(1);
      setStockError("");
      return;
    }
    
    if (newQuantity > availableStock) {
      setStockError(`Only ${availableStock} items available in stock`);
      setQuantity(availableStock);
      return;
    }
    
    setStockError("");
    setQuantity(newQuantity);
  };

  // ✅ NEW: Handle color variant selection
  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedImage(0);
    setQuantity(1);
    setStockError("");
  };

  const fetchSareeDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/sarees/${id}`);
      if (response.ok) {
        const data = await response.json();
        const sareeData = data.data || data;
        setSaree(sareeData);
      } else {
        toast({
          title: "Error",
          description: "Saree not found",
          variant: "destructive",
        });
        navigate("/sarees");
      }
    } catch (error) {
      console.error("Failed to fetch saree details:", error);
      toast({
        title: "Error",
        description: "Failed to load saree details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  // ✅ FIXED: Proper review fetching with state update
  const fetchReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/sarees/${id}/reviews`
      );
      if (response.ok) {
        const data = await response.json();
        const reviewsData = Array.isArray(data) ? data : (data.data || []);
        setReviews(reviewsData);

        if (isAuthenticated && user) {
          const userReviewExists = reviewsData.some(
            (review: Review) => review.userId === user.id || review.userEmail === user.email
          );
          setUserReview(userReviewExists);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  }, [id, isAuthenticated, user]);

  useEffect(() => {
    if (id) {
      fetchSareeDetails();
      fetchReviews();
    }
  }, [id, fetchSareeDetails, fetchReviews]);

  useEffect(() => {
    const cartItems = getCart();
    setInCart(cartItems.some((item) => item.id === id));
  }, [id]);

  // ✅ FIXED: Add to cart with stock validation
  const handleAddToCart = () => {
    if (!saree) return;

    const availableStock = getCurrentStock();
    
    // ✅ Validate stock before adding to cart
    if (quantity > availableStock) {
      setStockError(`Only ${availableStock} items available in stock`);
      toast({
        title: "Stock Limit Exceeded",
        description: `Only ${availableStock} items available`,
        variant: "destructive",
      });
      return;
    }

    if (availableStock === 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently unavailable",
        variant: "destructive",
      });
      return;
    }

    const selectedColor = saree.colorVariants?.[selectedColorIndex];

    const cartItem: CartItem = {
      id: saree._id,
      name: saree.name,
      price: saree.price,
      image: getCurrentImages()[0] || saree.imageUrl,
      type: "saree",
      quantity: quantity,
      selectedColor: selectedColor?.color,
    };

    addToCart(cartItem);
    setInCart(true);

    toast({
      title: "✨ Added to Cart!",
      description: `${quantity} ${saree.name}${selectedColor ? ` (${selectedColor.color})` : ''} added to cart!`,
    });
  };

  const handleAddToWishlist = () => {
    if (!saree) return;

    try {
      const wishlist = localStorage.getItem("wishlist");
      const wishlistItems = wishlist ? JSON.parse(wishlist) : [];
      
      const isAlreadyWishlisted = wishlistItems.some(
        (item: { id: string }) => item.id === saree._id
      );

      if (isAlreadyWishlisted) {
        const filtered = wishlistItems.filter(
          (item: { id: string }) => item.id !== saree._id
        );
        localStorage.setItem("wishlist", JSON.stringify(filtered));
        setInWishlist(false);

        toast({
          title: "❤️ Removed from Wishlist",
          description: `${saree.name} has been removed from your wishlist`,
        });
      } else {
        wishlistItems.push({
          id: saree._id,
          name: saree.name,
          price: saree.price,
          image: saree.imageUrl,
          category: saree.category,
        });
        localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
        setInWishlist(true);

        toast({
          title: "❤️ Added to Wishlist!",
          description: `${saree.name} saved for later!`,
        });
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    }
  };

  // ✅ FIXED: Complete review submission with proper state update
  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to write a review",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // ✅ Validation
    if (!reviewForm.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Review title is required",
        variant: "destructive",
      });
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast({
        title: "Validation Error",
        description: "Review comment is required",
        variant: "destructive",
      });
      return;
    }

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast({
        title: "Validation Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingReview(true);

      const response = await fetch(
        `http://localhost:5000/api/sarees/${id}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            rating: reviewForm.rating,
            title: reviewForm.title,
            comment: reviewForm.comment,
          }),
        }
      );

      if (response.ok) {
        const newReview = await response.json();
        
        // ✅ FIXED: Update reviews state immediately
        setReviews(prevReviews => [newReview, ...prevReviews]);
        setUserReview(true);
        
        // ✅ Reset form
        setReviewForm({ rating: 5, title: "", comment: "" });

        // ✅ Refetch saree details to update average rating
        await fetchSareeDetails();

        toast({
          title: "✅ Review Posted!",
          description: "Thank you for sharing your feedback!",
        });
      } else if (response.status === 403) {
        // 🔧 FIX: Handle 403 Forbidden - User hasn't purchased
        const error = await response.json();
        toast({
          title: "Cannot Review Yet",
          description: error.message || "🛍️ You can only review this saree after you've purchased and received it. Thank you for your interest!",
          variant: "destructive",
        });
      } else if (response.status === 409) {
        // 🔧 FIX: Handle 409 Conflict - Already reviewed
        const error = await response.json();
        toast({
          title: "Already Reviewed",
          description: error.message || "You've already shared your thoughts on this saree. Thank you!",
          variant: "destructive",
        });
      } else if (response.status === 400) {
        // 🔧 FIX: Handle 400 Bad Request - Validation errors
        const error = await response.json();
        toast({
          title: "Review Error",
          description: error.message || "Please check your review details and try again",
          variant: "destructive",
        });
      } else if (response.status === 404) {
        // 🔧 FIX: Handle 404 Not Found
        toast({
          title: "Saree Not Found",
          description: "This saree is no longer available",
          variant: "destructive",
        });
      } else {
        // 🔧 FIX: Handle all other errors with friendly message
        const error = await response.json();
        toast({
          title: "Unable to Post Review",
          description: error.message || "Something went wrong. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast({
        title: "Connection Error",
        description: "Unable to submit your review. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStarRating = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => interactive && onChange && onChange(i + 1)}
            disabled={!interactive}
            className={interactive ? "cursor-pointer" : "cursor-default"}
          >
            <Star
              size={20}
              className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
          </button>
        ))}
        <span className="ml-2 font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!saree) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground mb-4">Saree not found</p>
        <Button onClick={() => navigate("/sarees")}>Back to Sarees</Button>
      </div>
    );
  }

  const currentImages = getCurrentImages();
  const currentStock = getCurrentStock();

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b py-4 px-4">
          <div className="container mx-auto max-w-7xl">
            <button
              onClick={() => navigate("/sarees")}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ChevronLeft size={20} />
              Back to Sarees
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid lg:grid-cols-2 gap-12 mb-12">
              {/* Image Gallery with Magnifier */}
              <div className="space-y-4">
                {/* ✅ NEW: Image Magnifier Component */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="aspect-square bg-muted rounded-lg overflow-hidden relative"
                >
                  <ImageMagnifier
                    src={currentImages[selectedImage] || saree.imageUrl}
                    alt={saree.name}
                  />

                  {/* Stock Badge - ✅ FIXED: Don't show exact stock number */}
                  {currentStock === 0 && (
                    <div className="absolute top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg font-semibold z-10">
                      Out of Stock
                    </div>
                  )}
                  {currentStock > 0 && currentStock <= 3 && (
                    <div className="absolute top-4 right-4 bg-orange-500/90 text-white px-4 py-2 rounded-lg font-semibold animate-pulse z-10">
                      Limited Stock
                    </div>
                  )}
                </motion.div>

                {/* ✅ NEW: Thumbnail images for variants */}
                {currentImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {currentImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === idx
                            ? "border-primary scale-105"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${saree.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Category & Rating */}
                <div className="flex items-start justify-between">
                  <div>
                    <motion.span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-700 dark:text-purple-300 mb-4">
                      {saree.category}
                    </motion.span>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                      {saree.name}
                    </h1>
                  </div>
                </div>

                {/* Rating */}
                {saree.averageRating && saree.reviewCount ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3"
                  >
                    {renderStarRating(saree.averageRating)}
                    <p className="text-sm text-muted-foreground">
                      ({saree.reviewCount} review{saree.reviewCount !== 1 ? "s" : ""})
                    </p>
                  </motion.div>
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews yet</p>
                )}

                {/* Price */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Price</p>
                  <p className="text-4xl font-bold bg-gradient-saree bg-clip-text text-transparent">
                    ₹{saree.price.toLocaleString()}
                  </p>
                </motion.div>

                {/* ✅ NEW: Color Variants Selector */}
                {saree.colorVariants && saree.colorVariants.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.28 }}
                    className="space-y-3"
                  >
                    <p className="text-sm font-semibold">
                      Color: <span className="text-muted-foreground">{saree.colorVariants[selectedColorIndex].color}</span>
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {saree.colorVariants.map((variant, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleColorChange(idx)}
                          className={`relative group`}
                          title={variant.color}
                        >
                          <div
                            className={`w-12 h-12 rounded-full border-2 transition-all ${
                              selectedColorIndex === idx
                                ? "border-primary scale-110 shadow-lg"
                                : "border-gray-300 hover:border-primary/50 hover:scale-105"
                            }`}
                            style={{ backgroundColor: variant.colorCode }}
                          />
                          {selectedColorIndex === idx && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="text-white drop-shadow-lg" size={20} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ✅ NEW: Quantity Selector */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-semibold">Quantity</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-lg border border-input flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-20 h-10 text-center border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                      max={currentStock}
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= currentStock}
                      className="w-10 h-10 rounded-lg border border-input flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  {/* ✅ Stock Error Message */}
                  {stockError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {stockError}
                    </p>
                  )}
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">About</p>
                  <p className="text-foreground leading-relaxed">{saree.description}</p>
                </motion.div>

                {/* Specifications */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-3 pt-6 border-t"
                >
                  {saree.material && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Material</span>
                      <span className="font-semibold text-foreground">{saree.material}</span>
                    </div>
                  )}
                  {saree.color && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Color</span>
                      <span className="font-semibold text-foreground">{saree.color}</span>
                    </div>
                  )}
                  {saree.occasion && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Occasion</span>
                      <span className="font-semibold text-foreground">{saree.occasion}</span>
                    </div>
                  )}
                  {saree.length && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Length</span>
                      <span className="font-semibold text-foreground">{saree.length}</span>
                    </div>
                  )}
                  {saree.blousePrice && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Blouse Price</span>
                      <span className="font-semibold text-foreground">
                        ₹{saree.blousePrice.toLocaleString()}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* ✅ FIXED: Stock Status - Don't show exact number */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2 pt-6 border-t"
                >
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">Availability</p>
                  <p
                    className={`text-lg font-semibold ${
                      currentStock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {currentStock > 0
                      ? "In Stock - Ready to Ship"
                      : "Currently Out of Stock"}
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex gap-4 pt-6"
                >
                  <Button
                    onClick={handleAddToCart}
                    disabled={currentStock === 0 || inCart}
                    className={`flex-1 py-6 text-lg font-semibold flex items-center justify-center gap-2 ${
                      inCart
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gradient-saree hover:opacity-90"
                    } text-white`}
                  >
                    {inCart ? (
                      <>
                        <Check size={20} />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddToWishlist}
                    variant="outline"
                    size="lg"
                    className={`flex items-center justify-center gap-2 ${
                      inWishlist
                        ? "bg-red-50 text-red-600 border-red-300 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-700"
                        : "hover:bg-red-50 dark:hover:bg-red-900/20"
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={inWishlist ? "currentColor" : "none"}
                    />
                    <span className="hidden sm:inline">
                      {inWishlist ? "Wishlisted" : "Wishlist"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center justify-center gap-2"
                  >
                    <Share2 size={20} />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </motion.div>

                {/* Delivery Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                >
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    🚚 <strong>Free delivery</strong> on orders over ₹500
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                    📦 Estimated delivery: 3-7 business days
                  </p>
                </motion.div>
              </motion.div>
            </div>

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid lg:grid-cols-3 gap-8 py-12 border-t"
            >
              {/* Review Stats */}
              <Card className="p-6 lg:col-span-1">
                <h3 className="text-lg font-bold mb-6">Customer Reviews</h3>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                      {renderStarRating(saree.averageRating || 0)}
                      <p className="text-xs text-muted-foreground">
                        Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2 pt-4 border-t">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews.filter((r) => r.rating === rating).length;
                        const percentage = (count / reviews.length) * 100;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs font-semibold w-8">{rating}⭐</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
              </Card>

              {/* Review Form & Reviews */}
              <div className="lg:col-span-2 space-y-8">
                {/* Write Review Form */}
                {isAuthenticated && !userReview && (
                  <Card className="p-6 border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/20">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <MessageCircle size={20} />
                      Write a Review
                    </h3>

                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Rating */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Your Rating *</label>
                        {renderStarRating(reviewForm.rating, true, (rating) =>
                          setReviewForm({ ...reviewForm, rating })
                        )}
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Review Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Beautiful saree, great quality!"
                          value={reviewForm.title}
                          onChange={(e) =>
                            setReviewForm({ ...reviewForm, title: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          required
                        />
                      </div>

                      {/* Comment */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Your Review *</label>
                        <textarea
                          placeholder="Share your experience with this saree..."
                          value={reviewForm.comment}
                          onChange={(e) =>
                            setReviewForm({ ...reviewForm, comment: e.target.value })
                          }
                          rows={4}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full bg-gradient-saree text-white font-semibold py-2"
                      >
                        {submittingReview ? "Posting..." : "Post Review"}
                      </Button>
                    </form>
                  </Card>
                )}

                {userReview && (
                  <Card className="p-4 bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✅ You have already reviewed this saree
                    </p>
                  </Card>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">
                    Reviews ({reviews.length})
                  </h3>

                  {reviewsLoading ? (
                    <p className="text-muted-foreground">Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <Card className="p-8 text-center">
                      <MessageCircle size={40} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        No reviews yet. Be the first to share your experience!
                      </p>
                    </Card>
                  ) : (
                    <AnimatePresence>
                      {reviews.map((review, index) => (
                        <motion.div
                          key={review._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="p-6 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-bold text-foreground">{review.userName}</p>
                                  {review.isVerifiedBuyer && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded">
                                      <Check size={12} />
                                      Verified Buyer
                                    </span>
                                  )}
                                </div>
                                {renderStarRating(review.rating)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-foreground">{review.title}</p>
                              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                            </div>

                            <div className="flex items-center gap-4 pt-3 border-t">
                              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                                👍 Helpful ({review.helpful || 0})
                              </button>
                              {user && user.id === review.userId && (
                                <button className="ml-auto text-xs text-red-500 hover:text-red-600 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ✅ NEW: Recommended Sarees Section */}
            {saree && (
              <RecommendedSarees
                currentSaree={saree}
                category={saree.category}
                fabric={saree.fabric}
                priceRange={[saree.price * 0.7, saree.price * 1.3]}
                tags={saree.tags}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SareeDetails;