import { motion } from "framer-motion";
import { MapPin, Phone, Sparkles, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-primary/5 blur-2xl"
          style={{ top: "20%", left: "10%" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-primary/5 blur-2xl"
          style={{ bottom: "10%", right: "15%" }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Brand */}
          <motion.div 
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="flex items-center justify-center md:justify-start gap-2 mb-2"
              whileHover={{ scale: 1.02 }}
            >
              <p className="font-bold text-lg bg-gradient-saree bg-clip-text text-transparent">
                Siri Sarees
              </p>
              <Sparkles size={12} className="text-accent-gold" />
              <p className="font-bold text-lg bg-gradient-saree bg-clip-text text-transparent">
                Collections
              </p>
            </motion.div>
            <p className="text-sm text-muted-foreground">
              © 2026 All rights reserved.
            </p>
            <motion.p 
              className="text-xs text-muted-foreground mt-1 flex items-center justify-center md:justify-start gap-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Crafted with <Heart size={10} className="text-red-500 fill-red-500" /> for tradition
            </motion.p>
          </motion.div>

          {/* Quick Contact */}
          <motion.div 
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-semibold text-foreground mb-3 text-sm">Quick Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <motion.a 
                href="tel:+919398806893" 
                className="flex items-center gap-2 justify-center md:justify-start hover:text-primary transition-colors duration-300"
                whileHover={{ x: 5 }}
              >
                <Phone size={14} />
                <span>+91 9398806893</span>
              </motion.a>
              <motion.a 
                href="https://maps.app.goo.gl/hDfn9uqtwvty9Gf49"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 justify-center md:justify-start hover:text-primary transition-colors duration-300"
                whileHover={{ x: 5 }}
              >
                <MapPin size={14} />
                <span>Nagole, Hyderabad</span>
              </motion.a>
            </div>
          </motion.div>

          {/* Business Hours */}
          <motion.div 
            className="text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-semibold text-foreground mb-3 text-sm">Business Hours</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Mon - Sat: 9 AM - 7 PM</p>
              <p>Sunday: 10 AM - 5 PM</p>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
