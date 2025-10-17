import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Leaf, Heart, Star, Users, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroMain from "@/assets/hero-main.jpg";
import sareesHero from "@/assets/sarees-hero.jpg";
import sweetsHero from "@/assets/sweets-hero.jpg";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 z-10" />
          <img 
            src={heroMain} 
            alt="Siri Collections & Pickles" 
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Content */}
        <div className="container mx-auto px-4 text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <span className="inline-block bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                Siri Collections
              </span>
              <span className="text-white"> & </span>
              <span className="inline-block bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Sweets
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl md:text-3xl text-white/95 mb-10 max-w-3xl mx-auto font-medium drop-shadow-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              From Tradition to Taste — Crafted with Love
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-white text-purple-900 hover:bg-white/90 shadow-2xl text-lg px-8 py-6 font-bold"
                >
                  Contact Us
                  <ArrowRight className="ml-2" size={24} />
                </Button>
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
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Category Cards Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Saree Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/sarees">
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={sareesHero} 
                      alt="Sarees Collection" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-8 flex flex-col items-center justify-end text-white">
                      <ShoppingBag size={48} className="mb-3 group-hover:scale-110 transition-transform duration-300" />
                      <h2 className="text-3xl font-bold mb-2">Explore Sarees</h2>
                      <p className="text-white/90 text-center mb-4 text-sm">
                        Discover our exquisite collection of traditional and designer sarees
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span>Shop Now</span>
                        <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Sweets Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/sweets">
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={sweetsHero} 
                      alt="Sweets Collection" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-8 flex flex-col items-center justify-end text-white">
                      <Leaf size={48} className="mb-3 group-hover:scale-110 transition-transform duration-300" />
                      <h2 className="text-3xl font-bold mb-2">Explore Sweets</h2>
                      <p className="text-white/90 text-center mb-4 text-sm">
                        Taste our authentic homemade sweets made with traditional recipes
                      </p>
                      <div className="flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span>Shop Now</span>
                        <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground text-lg">
              Experience the perfect blend of tradition and quality
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="text-center p-8 rounded-2xl bg-card shadow-card hover:shadow-hover transition-all duration-300"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-saree flex items-center justify-center">
                <Heart size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Handcrafted with Love</h3>
              <p className="text-muted-foreground">
                Every product is made with genuine care and attention to detail, preserving traditional methods.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="text-center p-8 rounded-2xl bg-card shadow-card hover:shadow-hover transition-all duration-300"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-sweet flex items-center justify-center">
                <Star size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Premium Quality</h3>
              <p className="text-muted-foreground">
                We source the finest fabrics and freshest ingredients to ensure exceptional quality in every product.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="text-center p-8 rounded-2xl bg-card shadow-card hover:shadow-hover transition-all duration-300"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-saree flex items-center justify-center">
                <Users size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Family Tradition</h3>
              <p className="text-muted-foreground">
                A trusted family business bringing generations of expertise and authentic recipes to your home.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Snippet */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Our Story</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              At Siri Collections & Sweets, we bring together two beautiful traditions — 
              the elegance of handpicked ethnic wear and the authentic taste of homemade sweets. 
              Each product is crafted with love and dedication, preserving the essence of our heritage 
              while serving the modern family.
            </p>
            <Link to="/our-story">
              <Button
                variant="outline"
                size="lg"
                className="group"
              >
                Read Our Full Story
                <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform duration-300" size={20} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
