import { motion, useScroll, useTransform } from "framer-motion";
import { Heart, Users, Award, Sparkles, ArrowRight, Quote } from "lucide-react";
import { useRef } from "react";

const OurStory = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const values = [
    {
      icon: Heart,
      title: "Made with Love",
      description: "Every saree we curate is selected with genuine care and attention to detail.",
      color: "from-purple-600 to-pink-600",
      iconColor: "text-pink-500",
    },
    {
      icon: Users,
      title: "Family Tradition",
      description: "A family business that has been preserving traditional ethnic wear for generations.",
      color: "from-purple-600 to-purple-800",
      iconColor: "text-purple-500",
    },
    {
      icon: Award,
      title: "Quality First",
      description: "We never compromise on quality - from the finest silk to elegant cotton weaves.",
      color: "from-amber-500 to-orange-600",
      iconColor: "text-amber-500",
    },
    {
      icon: Sparkles,
      title: "Authentic Experience",
      description: "Bringing you the elegance and grace of traditional Indian sarees.",
      color: "from-rose-500 to-purple-600",
      iconColor: "text-rose-500",
    },
  ];

  const timeline = [
    { year: "2015", title: "The Beginning", description: "Started with a vision to share traditional elegance" },
    { year: "2018", title: "Growing Trust", description: "Became a trusted name in our community" },
    { year: "2021", title: "Digital Expansion", description: "Launched our online platform to serve more families" },
    { year: "2024", title: "Today", description: "Serving thousands of families with authentic sarees" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-bg-primary overflow-hidden">
      
      {/* Hero Section - Parallax Effect */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-r from-amber-400/20 to-rose-400/20 rounded-full blur-3xl"
        />

        {/* Hero Content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center max-w-4xl mx-auto px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-6 inline-block"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Sparkles className="text-white" size={40} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-serif font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Our Story
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-text-secondary font-light tracking-wide"
          >
            Where Heritage Meets Elegance
          </motion.p>

          {/* Decorative Line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-purple-600 to-transparent"
          />
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-purple-600 rounded-full flex justify-center p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-purple-600 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Story Content - Beautiful Cards */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          
          {/* Quote Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-20 relative"
          >
            <div className="absolute top-0 left-0 text-purple-200 dark:text-purple-900/30">
              <Quote size={80} />
            </div>
            <div className="relative z-10 pl-20 pr-4">
              <p className="text-3xl md:text-4xl font-serif italic text-text-primary leading-relaxed">
                A labor of love that brings the beautiful tradition of Indian ethnic wear to modern families.
              </p>
              <p className="mt-6 text-xl text-purple-600 dark:text-purple-400 font-semibold">
                — Siri Sarees Collections
              </p>
            </div>
          </motion.div>

          {/* Story Paragraphs - Staggered Cards */}
          <div className="space-y-8">
            {[
              {
                highlight: "Our Journey",
                text: "Our journey began with a simple vision: to share the elegance of traditional sarees with families across our community. What started as a small family initiative has blossomed into a trusted name, known for quality, authenticity, and genuine care."
              },
              {
                highlight: "Our Collection",
                text: "We handpick exquisite sarees — from vibrant silk weaves to elegant cotton designs — each piece carefully selected to celebrate the grace and beauty of Indian tradition. Whether it's a grand wedding, a festive celebration, or everyday elegance, we have the perfect saree for every occasion."
              },
              {
                highlight: "Our Heritage",
                text: "Every product we offer carries a piece of our heritage, made with dedication to preserve the essence of our culture while serving the modern family. When you choose Siri Sarees and Collections, you're not just buying a saree — you're becoming part of our story."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="group"
              >
                <div className="bg-bg-card border border-border-light rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                        <span className="text-white font-bold text-xl">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-3">
                        {item.highlight}
                      </h3>
                      <p className="text-lg text-text-secondary leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 bg-bg-secondary relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-2 border-purple-600 rounded-full"
          />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-primary mb-4">
              Our Journey Through Time
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full" />
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Center Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-purple-600 via-pink-600 to-purple-600 hidden md:block" />

            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content Card */}
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-bg-card border border-border-light rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
                  >
                    <div className={`inline-block px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4`}>
                      <span className="text-white font-bold text-lg">{item.year}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-text-secondary">{item.description}</p>
                  </motion.div>
                </div>

                {/* Center Dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
                  <motion.div
                    whileHover={{ scale: 1.5 }}
                    className="w-6 h-6 bg-purple-600 rounded-full border-4 border-bg-secondary shadow-lg"
                  />
                </div>

                {/* Spacer */}
                <div className="w-full md:w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section - Glassmorphism Cards */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-text-primary mb-4">
              What We Stand For
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              The values that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${value.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`} />
                
                {/* Card */}
                <div className="relative bg-bg-card border border-border-light rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
                  {/* Icon with Animated Background */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <value.icon size={40} className="text-white" />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-text-primary mb-3 group-hover:text-purple-600 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {value.description}
                  </p>

                  {/* Decorative Corner */}
                  <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${value.iconColor} opacity-50`} />
                  <div className={`absolute bottom-4 left-4 w-2 h-2 rounded-full ${value.iconColor} opacity-50`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Eye-Catching */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-16 h-16 text-white mx-auto mb-6" />
            
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
              Experience the Tradition
            </h2>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              We invite you to explore our collections and discover the elegance we bring to every saree. 
              Join our family today!
            </p>

            <motion.a
              href="/sarees"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 bg-white text-purple-600 px-10 py-5 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/20 transition-all"
            >
              Explore Our Collection
              <ArrowRight size={24} />
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default OurStory;