import { createContext } from "react";

export type User = {
  id: string;
  email: string;
  role: string;
};

export type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);
  