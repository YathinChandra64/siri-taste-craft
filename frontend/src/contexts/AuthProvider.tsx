import { useState, useEffect, ReactNode } from "react";
import { AuthContext, AuthContextType, User } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check if user is already logged in (on app load/refresh)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("authToken"); // ✅ Using 'authToken'
        
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        });

        if (response.ok) {
          const userData: User = await response.json();
          setUser(userData);
          // ✅ Store user info in localStorage for app purposes
          localStorage.setItem("user", JSON.stringify(userData));
        } else if (response.status === 401) {
          // ✅ Token expired, clear storage
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("authToken", data.token); // ✅ Using 'authToken'
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
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Signup failed");
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("authToken", data.token); // ✅ Using 'authToken'
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
    localStorage.removeItem("authToken"); // ✅ Using 'authToken'
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