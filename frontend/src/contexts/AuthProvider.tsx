import { useState, useEffect, ReactNode } from "react";
import { AuthContext, AuthContextType, User } from "./AuthContext";
import API from "@/lib/api"; // ✅ Use Axios instead of fetch

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check if user is already logged in (on app load/refresh)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("authToken");
        
        if (!token) {
          setLoading(false);
          return;
        }

        // ✅ FIXED: Use Axios instead of fetch
        // Axios interceptor will automatically add the token
        const response = await API.get("/auth/me");

        const userData: User = response.data;
        setUser(userData);
        // ✅ Store user info in localStorage for app purposes
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        console.error("Auth check failed:", error);
        // ✅ If 401, token is invalid
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // ✅ FIXED: Use Axios (doesn't need credentials: include for JWT)
      const response = await API.post("/auth/login", {
        email,
        password
      });

      const data = response.data;

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      // ✅ Store user info in localStorage
      const userData: User = data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // ✅ FIXED: Use Axios (doesn't need credentials: include for JWT)
      const response = await API.post("/auth/signup", {
        name,
        email,
        password
      });

      const data = response.data;

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      // ✅ Store user info in localStorage
      const userData: User = data.user;
      localStorage.setItem("user", JSON.stringify(userData));
      
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};