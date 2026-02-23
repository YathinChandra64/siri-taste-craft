import { motion } from "framer-motion";
import { MapPin, Phone, Sparkles, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-bg-card border-t border-border-light mt-16 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-primary-purple/5 blur-2xl"
          style={{ top: "20%", left: "10%" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-primary-purple/5 blur-2xl"
          style={{ bottom: "10%", right: "15%" }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-start mb-8">
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
              <p className="font-bold text-lg text-text-primary">
                Siri Sarees
              </p>
              <Sparkles size={12} className="text-accent-gold" />
              <p className="font-bold text-lg text-text-primary">
                Collections
              </p>
            </motion.div>
            <p className="text-sm text-text-secondary">
              © 2026 All rights reserved.
            </p>
            <motion.p 
              className="text-xs text-text-muted mt-1 flex items-center justify-center md:justify-start gap-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Crafted with <Heart className="w-3 h-3" /> for you
            </motion.p>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-semibold text-text-primary mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-text-secondary hover:text-primary-purple transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/sarees" className="text-sm text-text-secondary hover:text-primary-purple transition-colors">
                  Sarees
                </a>
              </li>
              <li>
                <a href="/our-story" className="text-sm text-text-secondary hover:text-primary-purple transition-colors">
                  Our Story
                </a>
              </li>
              <li>
                <a href="/contact" className="text-sm text-text-secondary hover:text-primary-purple transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="text-center md:text-right"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-semibold text-text-primary mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-end gap-2">
                <MapPin size={16} className="text-accent-gold flex-shrink-0" />
                <span className="text-sm text-text-secondary">
                  Hyderabad, India
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-2">
                <Phone size={16} className="text-accent-gold flex-shrink-0" />
                <a href="tel:+919876543210" className="text-sm text-text-secondary hover:text-primary-purple transition-colors">
                  +91 9876543210
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light my-6" />

        {/* Social & Legal */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary-purple transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-purple transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-purple transition-colors">Returns</a>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary-purple transition-colors">Facebook</a>
            <a href="#" className="hover:text-primary-purple transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary-purple transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;