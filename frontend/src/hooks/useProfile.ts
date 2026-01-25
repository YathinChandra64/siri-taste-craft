import { useState, useEffect } from "react";
import { User } from "@/types/profile";
import { getUserProfile, updateUserProfile } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";

export const useProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      setUser(profile);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load profile";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updated = await updateUserProfile(data);
      setUser(updated);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { user, loading, error, fetchProfile, updateProfile };
};