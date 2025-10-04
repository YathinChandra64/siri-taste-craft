import { MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Brand */}
          <div className="text-center md:text-left">
            <p className="font-bold text-lg mb-2 bg-gradient-saree bg-clip-text text-transparent">
              Siri Collections & Pickles
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Where Tradition Meets Taste
            </p>
          </div>

          {/* Quick Contact */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Quick Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a 
                href="tel:+919248627327" 
                className="flex items-center gap-2 justify-center md:justify-start hover:text-primary transition-colors duration-300"
              >
                <Phone size={14} />
                <span>+91 9248627327</span>
              </a>
              <a 
                href="https://maps.app.goo.gl/hDfn9uqtwvty9Gf49"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 justify-center md:justify-start hover:text-primary transition-colors duration-300"
              >
                <MapPin size={14} />
                <span>Nagole, Hyderabad</span>
              </a>
            </div>
          </div>

          {/* Business Hours */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold text-foreground mb-3 text-sm">Business Hours</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Mon - Sat: 9 AM - 7 PM</p>
              <p>Sunday: 10 AM - 5 PM</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
