import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { addToCart, getCart } from "@/utils/cart";

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

  const [saree, setSaree] = useState<Saree | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [userReview, setUserReview] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [stockError, setStockError] = useState("");
  const [activeReviewTab, setActiveReviewTab] = useState<"form" | "list">("list");

  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const getCurrentStock = useCallback((): number => {
    if (!saree) return 0;
    if (saree.colorVariants && saree.colorVariants.length > 0) {
      return saree.colorVariants[selectedColorIndex]?.stock || 0;
    }
    return saree.stock || 0;
  }, [saree, selectedColorIndex]);

  const getCurrentImages = useCallback((): string[] => {
    if (!saree) return [];
    if (saree.colorVariants && saree.colorVariants.length > 0) {
      const variantImages = saree.colorVariants[selectedColorIndex]?.images;
      return variantImages && variantImages.length > 0 ? variantImages : [saree.imageUrl];
    }
    return [saree.imageUrl];
  }, [saree, selectedColorIndex]);

  const handleQuantityChange = (newQuantity: number) => {
    const availableStock = getCurrentStock();
    if (newQuantity < 1) {
      setQuantity(1);
      setStockError("");
      return;
    }
    if (newQuantity > availableStock) {
      setStockError(`Only ${availableStock} items available`);
      setQuantity(availableStock);
      return;
    }
    setStockError("");
    setQuantity(newQuantity);
  };

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

  const handleAddToCart = () => {
    if (!saree) return;
    const availableStock = getCurrentStock();
    
    if (quantity > availableStock) {
      setStockError(`Only ${availableStock} items available`);
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
      description: `${quantity} ${saree.name} added successfully!`,
    });
  };

  const handleShare = async () => {
    if (!saree) return;

    const shareUrl = `${window.location.origin}/sarees/${saree._id}`;
    const shareTitle = saree.name;
    const shareText = `Check out this beautiful ${saree.category} saree - ${saree.name} at ₹${saree.price.toLocaleString()}!`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast({
          title: "✨ Shared!",
          description: "Thank you for sharing this saree!",
        });
      } catch (error) {
        // User canceled the share dialog
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "✨ Link Copied!",
          description: "Saree link copied to clipboard. Share it with friends!",
        });
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "✨ Link Copied!",
          description: "Saree link copied to clipboard. Share it with friends!",
        });
      }
    }
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
          description: `${saree.name} has been removed`,
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
          description: `${saree.name} saved for later`,
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

    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all review fields",
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
        setReviews(prevReviews => [newReview, ...prevReviews]);
        setUserReview(true);
        setReviewForm({ rating: 5, title: "", comment: "" });
        setActiveReviewTab("list");
        await fetchSareeDetails();
        toast({
          title: "✅ Review Posted!",
          description: "Thank you for sharing your feedback!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Review Error",
          description: error.message || "Failed to post review",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast({
        title: "Connection Error",
        description: "Unable to submit your review",
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
              className={i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
            />
          </button>
        ))}
        <span className="ml-2 font-semibold text-sm">{rating.toFixed(1)}</span>
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
    <div className="min-h-screen relative bg-white dark:bg-slate-950">
      <AnimatedBackground />

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b bg-white/80 dark:bg-slate-900/50 backdrop-blur sticky top-0 z-20">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate("/sarees")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={18} />
              Back to Collection
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Product Grid */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Image Gallery */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl overflow-hidden relative group"
                >
                  <ImageMagnifier
                    src={currentImages[selectedImage] || saree.imageUrl}
                    alt={saree.name}
                  />

                  {/* Stock Badge */}
                  {currentStock === 0 && (
                    <div className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Out of Stock
                    </div>
                  )}
                  {currentStock > 0 && currentStock <= 3 && (
                    <div className="absolute top-6 right-6 bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
                      Low Stock
                    </div>
                  )}
                </motion.div>

                {/* Thumbnails */}
                {currentImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {currentImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                          selectedImage === idx
                            ? "border-primary ring-2 ring-primary/30 scale-105"
                            : "border-muted opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`View ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-4">
                  <div className="inline-flex">
                    <motion.span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {saree.category}
                    </motion.span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                    {saree.name}
                  </h1>

                  {/* Rating */}
                  {saree.averageRating && saree.reviewCount ? (
                    <motion.div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        {renderStarRating(saree.averageRating)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {saree.reviewCount} review{saree.reviewCount !== 1 ? "s" : ""}
                      </p>
                    </motion.div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                  )}
                </div>

                {/* Price Section */}
                <motion.div className="pt-6 border-t border-b py-6 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</p>
                  <div className="flex items-baseline gap-4">
                    <p className="text-5xl font-bold text-foreground">
                      ₹{saree.price.toLocaleString()}
                    </p>
                    {saree.blousePrice && (
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">Blouse: ₹{saree.blousePrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Color Variants */}
                {saree.colorVariants && saree.colorVariants.length > 0 && (
                  <motion.div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Color: <span className="text-primary">{saree.colorVariants[selectedColorIndex].color}</span>
                      </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {saree.colorVariants.map((variant, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleColorChange(idx)}
                          className={`relative group transition-all duration-300`}
                          title={variant.color}
                        >
                          <div
                            className={`w-14 h-14 rounded-full border-2 transition-all duration-300 ${
                              selectedColorIndex === idx
                                ? "border-primary shadow-lg shadow-primary/30 scale-110"
                                : "border-gray-300 hover:border-primary hover:scale-105"
                            }`}
                            style={{ backgroundColor: variant.colorCode }}
                          />
                          {selectedColorIndex === idx && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Check className="text-white drop-shadow-lg" size={24} />
                            </motion.div>
                          )}
                          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            {variant.color}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Quantity */}
                <motion.div className="space-y-4">
                  <p className="text-sm font-semibold">Quantity</p>
                  <div className="flex items-center gap-2 bg-muted rounded-xl p-1 w-fit">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 text-center bg-transparent font-semibold focus:outline-none"
                      min="1"
                      max={currentStock}
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= currentStock}
                      className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>
                  {stockError && (
                    <p className="text-sm text-red-500">{stockError}</p>
                  )}
                </motion.div>

                {/* Stock Status */}
                <motion.div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Availability</p>
                  <p className={`text-sm font-semibold ${currentStock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {currentStock > 0 ? "✓ In Stock - Ready to Ship" : "Out of Stock"}
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={currentStock === 0}
                    className={`flex-1 py-6 text-base font-semibold flex items-center justify-center gap-2 rounded-xl transition-all ${
                      inCart
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    }`}
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
                    className={`rounded-xl border-2 transition-all ${
                      inWishlist
                        ? "bg-red-50 text-red-600 border-red-300 dark:bg-red-900/20 dark:border-red-700"
                        : "border-muted hover:border-red-300"
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={inWishlist ? "currentColor" : "none"}
                    />
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Share2 size={20} />
                  </Button>
                </motion.div>

                {/* Trust Badges */}
                <motion.div className="space-y-3 pt-6 border-t">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Truck size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Free Shipping</p>
                      <p className="text-xs text-muted-foreground">On orders over ₹500</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Shield size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Secure Payment</p>
                      <p className="text-xs text-muted-foreground">100% safe & secure</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <RotateCcw size={18} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Easy Returns</p>
                      <p className="text-xs text-muted-foreground">7 days return policy</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Details Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Description & Specs */}
              <div className="grid md:grid-cols-2 gap-8 py-12 border-t border-b">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">About This Saree</h3>
                  <p className="text-foreground/80 leading-relaxed">{saree.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Specifications</h3>
                  <div className="space-y-3">
                    {saree.material && (
                      <div className="flex justify-between pb-3 border-b">
                        <span className="text-muted-foreground">Material</span>
                        <span className="font-semibold">{saree.material}</span>
                      </div>
                    )}
                    {saree.fabric && (
                      <div className="flex justify-between pb-3 border-b">
                        <span className="text-muted-foreground">Fabric</span>
                        <span className="font-semibold">{saree.fabric}</span>
                      </div>
                    )}
                    {saree.occasion && (
                      <div className="flex justify-between pb-3 border-b">
                        <span className="text-muted-foreground">Occasion</span>
                        <span className="font-semibold">{saree.occasion}</span>
                      </div>
                    )}
                    {saree.length && (
                      <div className="flex justify-between pb-3 border-b">
                        <span className="text-muted-foreground">Length</span>
                        <span className="font-semibold">{saree.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="py-12 space-y-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">Customer Reviews</h3>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-3">
                      {renderStarRating(saree.averageRating || 0)}
                      <span className="text-sm text-muted-foreground">({reviews.length})</span>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {/* Review Stats */}
                  <Card className="p-6 rounded-2xl border border-gray-200 dark:border-0 bg-white dark:bg-slate-900/50">
                    <h4 className="font-bold mb-6">Rating Distribution</h4>
                    {reviews.length > 0 ? (
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviews.filter((r) => r.rating === rating).length;
                          const percentage = (count / reviews.length) * 100;
                          return (
                            <div key={rating} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold">{rating}⭐</span>
                                <span className="text-muted-foreground">{count}</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5 }}
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No reviews yet</p>
                    )}
                  </Card>

                  {/* Reviews List & Form */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Write Review Button */}
                    {isAuthenticated && !userReview && (
                      <motion.div className="flex gap-2">
                        <Button
                          onClick={() => setActiveReviewTab("form")}
                          className={`flex-1 rounded-xl font-semibold transition-all ${
                            activeReviewTab === "form"
                              ? "bg-primary text-white"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          }`}
                        >
                          <MessageCircle size={18} className="mr-2" />
                          Write a Review
                        </Button>
                        <Button
                          onClick={() => setActiveReviewTab("list")}
                          className={`flex-1 rounded-xl font-semibold transition-all ${
                            activeReviewTab === "list"
                              ? "bg-primary text-white"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          }`}
                        >
                          See Reviews
                        </Button>
                      </motion.div>
                    )}

                    {/* Review Form */}
                    <AnimatePresence>
                      {activeReviewTab === "form" && isAuthenticated && !userReview && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Card className="p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-900/30 dark:to-slate-800/30">
                            <form onSubmit={handleSubmitReview} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold">Your Rating</label>
                                {renderStarRating(reviewForm.rating, true, (rating) =>
                                  setReviewForm({ ...reviewForm, rating })
                                )}
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-semibold">Title</label>
                                <input
                                  type="text"
                                  placeholder="Summarize your experience..."
                                  value={reviewForm.title}
                                  onChange={(e) =>
                                    setReviewForm({ ...reviewForm, title: e.target.value })
                                  }
                                  className="w-full px-4 py-2 rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-semibold">Review</label>
                                <textarea
                                  placeholder="Share your experience..."
                                  value={reviewForm.comment}
                                  onChange={(e) =>
                                    setReviewForm({ ...reviewForm, comment: e.target.value })
                                  }
                                  rows={4}
                                  className="w-full px-4 py-2 rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background"
                                  required
                                />
                              </div>

                              <Button
                                type="submit"
                                disabled={submittingReview}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl py-2"
                              >
                                {submittingReview ? "Posting..." : "Post Review"}
                              </Button>
                            </form>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {reviewsLoading ? (
                        <p className="text-muted-foreground text-center py-8">Loading reviews...</p>
                      ) : reviews.length === 0 ? (
                        <Card className="p-12 text-center rounded-2xl border border-gray-200 dark:border-0 bg-gray-50/50 dark:bg-slate-900/30">
                          <MessageCircle size={40} className="mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">No reviews yet. Be the first to share!</p>
                        </Card>
                      ) : (
                        <AnimatePresence>
                          {reviews.slice(0, 5).map((review, index) => (
                            <motion.div
                              key={review._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="p-6 rounded-2xl border border-gray-200 dark:border-0 bg-white dark:bg-slate-900/50">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="font-semibold text-foreground">{review.userName}</p>
                                      {review.isVerifiedBuyer && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                          <Check size={12} />
                                          Verified
                                        </span>
                                      )}
                                    </div>
                                    {renderStarRating(review.rating)}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <p className="font-semibold text-foreground text-sm">{review.title}</p>
                                  <p className="text-sm text-foreground/70">{review.comment}</p>
                                </div>

                                <div className="flex items-center gap-4 pt-4 mt-4 border-t text-xs text-muted-foreground">
                                  <button className="hover:text-foreground transition-colors">
                                    👍 Helpful ({review.helpful || 0})
                                  </button>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recommended Sarees */}
            {saree && <RecommendedSarees currentSaree={saree} category={saree.category} fabric={saree.fabric} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SareeDetails;