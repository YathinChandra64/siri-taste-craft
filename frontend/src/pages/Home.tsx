import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Heart, Star, Users, Sparkles } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import RippleEffect from "@/components/RippleEffect";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import heroMain from "@/assets/hero-main.jpg";
import sareesHero from "@/assets/sarees-hero.jpg";

const Home = () => {
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.5]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedBackground />
      {/* REMOVED: <Navbar /> - Now in App.tsx */}

      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Rest of your Home component code stays the same */}
        {/* Background Image with Parallax */}
        <motion.div 
          className="absolute inset-0"
          style={{ scale: heroScale, opacity: heroOpacity }}
        >
          <motion.div 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 z-10" />
            <img 
              src={heroMain} 
              alt="Siri Sarees and Collections" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="container mx-auto px-4 text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Animated Brand Name */}
            <motion.div className="mb-6">
              <motion.h1 
                className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg"
              >
                <motion.span 
                  className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -50, rotateY: -90 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                >
                  Siri Sarees
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="inline-block mx-3"
                >
                  <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
                </motion.span>
                <motion.span 
                  className="inline-block bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: 50, rotateY: 90 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
                >
                  Collections
                </motion.span>
              </motion.h1>
            </motion.div>

            <motion.p 
              className="text-xl md:text-3xl text-white/95 mb-10 max-w-3xl mx-auto font-medium drop-shadow-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <motion.span
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent bg-[length:200%_auto]"
              >
                Where Tradition Meets Elegance
              </motion.span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Link to="/sarees">
                <RippleEffect>
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="lg"
                      className="bg-gradient-saree text-white hover:opacity-90 shadow-2xl text-lg px-8 py-6 font-bold"
                    >
                      Explore Collection
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="ml-2" size={24} />
                      </motion.div>
                    </Button>
                  </motion.div>
                </RippleEffect>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2"
          >
            <motion.div 
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Category Card Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto">
          <StaggerContainer className="flex justify-center">
            {/* Saree Card */}
            <StaggerItem>
              <Link to="/sarees">
                <motion.div
                  whileHover={{ scale: 1.03, y: -8, rotateY: 5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 group perspective-1000 max-w-2xl"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <motion.img 
                      src={sareesHero} 
                      alt="Sarees Collection" 
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-8 flex flex-col items-center justify-end text-white">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <ShoppingBag size={48} className="mb-3" />
                      </motion.div>
                      <h2 className="text-3xl font-bold mb-2">Explore Sarees</h2>
                      <p className="text-white/90 text-center mb-4 text-sm">
                        Discover our exquisite collection of traditional and designer sarees
                      </p>
                      <motion.div 
                        className="flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                      >
                        <span>Shop Now</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight size={16} />
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Why Choose Us
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Experience the perfect blend of tradition and quality
            </motion.p>
          </motion.div>

          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Handcrafted with Love",
                description: "Every saree is selected with genuine care and attention to detail, preserving traditional craftsmanship.",
                gradient: "bg-gradient-saree",
              },
              {
                icon: Star,
                title: "Premium Quality",
                description: "We source the finest fabrics to ensure exceptional quality in every piece of our collection.",
                gradient: "bg-gradient-saree",
              },
              {
                icon: Users,
                title: "Family Tradition",
                description: "A trusted family business bringing generations of expertise and authentic products to your home.",
                gradient: "bg-gradient-saree",
              },
            ].map((feature) => (
              <StaggerItem key={feature.title}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -10, rotateX: 5 }}
                  className="text-center p-8 rounded-2xl bg-card shadow-card hover:shadow-hover transition-all duration-300"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <motion.div 
                    className={`w-20 h-20 mx-auto mb-6 rounded-full ${feature.gradient} flex items-center justify-center`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon size={40} className="text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* About Snippet */}
      <section className="py-16 px-4 bg-muted/30 relative z-10">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Our Story</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              At <span className="font-semibold text-primary">Siri Sarees and Collections</span>, we bring the elegance of 
              traditional ethnic wear to modern families. Each saree is carefully selected and curated with love, 
              preserving the essence of our heritage while serving the contemporary woman.
            </p>
            <Link to="/our-story">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="group"
                >
                  Read Our Full Story
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="ml-2" size={20} />
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>
      {/* REMOVED: <Footer /> - Now in App.tsx */}
    </div>
  );
};

export default Home;