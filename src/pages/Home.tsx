import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Leaf, Heart, Star, Users, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              <span className="bg-gradient-saree bg-clip-text text-transparent">
                Siri Collections
              </span>
              <span className="text-foreground"> & </span>
              <span className="bg-gradient-pickle bg-clip-text text-transparent">
                Pickles
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              From Tradition to Taste — Crafted with Love
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-light text-primary-foreground shadow-hover"
                >
                  Contact Us
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
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
                  className="relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 group"
                >
                  <div className="aspect-[4/3] bg-gradient-saree p-8 flex flex-col items-center justify-center text-white">
                    <ShoppingBag size={64} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h2 className="text-3xl font-bold mb-3">Explore Sarees</h2>
                    <p className="text-white/90 text-center mb-4">
                      Discover our exquisite collection of traditional and designer sarees
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>Shop Now</span>
                      <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Pickle Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/pickles">
                <motion.div
                  whileHover={{ scale: 1.03, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 group"
                >
                  <div className="aspect-[4/3] bg-gradient-pickle p-8 flex flex-col items-center justify-center text-white">
                    <Leaf size={64} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h2 className="text-3xl font-bold mb-3">Explore Pickles</h2>
                    <p className="text-white/90 text-center mb-4">
                      Taste our authentic homemade pickles made with traditional recipes
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>Shop Now</span>
                      <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
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
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-pickle flex items-center justify-center">
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
              At Siri Collections & Pickles, we bring together two beautiful traditions — 
              the elegance of handpicked ethnic wear and the authentic taste of homemade pickles. 
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
