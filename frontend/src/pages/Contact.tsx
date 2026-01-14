import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you soon.",
    });
    (e.target as HTMLFormElement).reset();
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      content: "22A, Rd No2b, Hanuman Nagar Garden II, Nagole, Hyderabad, Telangana 500068",
      link: "https://maps.app.goo.gl/hDfn9uqtwvty9Gf49",
      gradient: "bg-gradient-saree",
    },
    {
      icon: Phone,
      title: "Phone",
      content: "+91 9248627327",
      link: "tel:+919248627327",
      gradient: "bg-gradient-sweet",
    },
    {
      icon: Mail,
      title: "Email",
      content: "yathinchandra589@gmail.com",
      link: "mailto:yathinchandra589@gmail.com",
      gradient: "bg-gradient-saree",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Get in Touch
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We'd love to hear from you. Reach out to us for any queries or feedback.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold mb-6 text-foreground">Contact Information</h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <motion.a
                      key={info.title}
                      href={info.link}
                      target={info.icon === MapPin ? "_blank" : undefined}
                      rel={info.icon === MapPin ? "noopener noreferrer" : undefined}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300"
                    >
                      <div className={`${info.gradient} p-3 rounded-lg text-white`}>
                        <info.icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                        <p className="text-muted-foreground">{info.content}</p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Business Hours */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Business Hours</h3>
                <div className="space-y-2 text-muted-foreground">
                  <p>Monday - Saturday: 9:00 AM - 7:00 PM</p>
                  <p>Sunday: 10:00 AM - 5:00 PM</p>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-card">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    rows={5}
                    required
                    className="w-full resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-saree text-white border-0 shadow-hover hover:shadow-soft transition-all duration-300"
                >
                  Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
