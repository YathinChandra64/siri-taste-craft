import { motion } from "framer-motion";
import { User } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, User as UserIcon } from "lucide-react";

interface ProfileHeaderProps {
  user: User;
  onEditClick: () => void;
}

export const ProfileHeader = ({ user, onEditClick }: ProfileHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-card p-8 mb-8"
    >
      <div className="flex gap-8 items-start">
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-24 h-24 rounded-full bg-gradient-saree flex items-center justify-center flex-shrink-0"
        >
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <UserIcon className="w-12 h-12 text-white" />
          )}
        </motion.div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">{user.name}</h1>
          
          <div className="space-y-2 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{user.address}, {user.city}, {user.state} {user.zipCode}</span>
              </div>
            )}
          </div>

          <Button
            onClick={onEditClick}
            className="bg-gradient-saree text-white"
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </motion.div>
  );
};