import { motion } from "framer-motion";
import { Heart, Users, Award, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const OurStory = () => {
  const values = [
    {
      icon: Heart,
      title: "Made with Love",
      description: "Every saree we curate and every pickle we prepare is crafted with genuine care and attention to detail.",
      gradient: "bg-gradient-saree",
    },
    {
      icon: Users,
      title: "Family Tradition",
      description: "A family business that has been preserving traditional recipes and ethnic wear for generations.",
      gradient: "bg-gradient-pickle",
    },
    {
      icon: Award,
      title: "Quality First",
      description: "We never compromise on quality - from the finest fabrics to the freshest ingredients.",
      gradient: "bg-gradient-saree",
    },
    {
      icon: Sparkles,
      title: "Authentic Experience",
      description: "Bringing you the authentic taste of homemade pickles and the elegance of traditional sarees.",
      gradient: "bg-gradient-pickle",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Our Story
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Where Heritage Meets Heart
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6 text-muted-foreground text-lg leading-relaxed"
            >
              <p>
                <span className="text-foreground font-semibold">Siri Collections & Pickles</span> is more than just a business — 
                it's a labor of love that brings together two beautiful traditions passed down through generations.
              </p>
              <p>
                Our journey began with a simple vision: to share the elegance of traditional ethnic wear and the authentic 
                flavors of homemade pickles with families across our community. What started as a small family initiative 
                has blossomed into a trusted name, known for quality, authenticity, and genuine care.
              </p>
              <p>
                On one hand, we handpick exquisite sarees — from vibrant silk weaves to elegant cotton designs — each piece 
                carefully selected to celebrate the grace and beauty of Indian tradition. On the other hand, we prepare 
                pickles using time-honored recipes, fresh ingredients, and the same love that goes into a grandmother's kitchen.
              </p>
              <p>
                Every product we offer carries a piece of our heritage, made with dedication to preserve the essence of our 
                culture while serving the modern family. When you choose Siri Collections & Pickles, you're not just buying 
                a product — you're becoming part of our story.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What We Stand For
              </h2>
              <p className="text-muted-foreground text-lg">
                The values that guide everything we do
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="bg-card p-8 rounded-2xl shadow-card hover:shadow-hover transition-all duration-300"
                >
                  <div className={`${value.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
                    <value.icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Experience the Tradition
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                We invite you to explore our collections and taste the authenticity we bring to every product. 
                Join our family today!
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OurStory;
