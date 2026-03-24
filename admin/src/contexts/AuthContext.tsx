import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profileImage?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Initialize auth state from localStorage
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
          setToken(storedToken);
          const userData = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name || "Admin",
            role: decoded.role,
            profileImage: decoded.profileImage,
            mustChangePassword: decoded.mustChangePassword,
          };
          setUser(userData);

          // If the token is missing name, fetch the full profile silently
          if (!decoded.name || !decoded.profileImage) {
            const fetchProfile = async () => {
              try {
                // Note: Do NOT use the standard intercepted `api` instance here
                // to avoid triggering the 401 logout flow for a background fetch.
                const response = await api.get(`/users/${decoded.sub}`);
                if (response.data) {
                  setUser(prev => prev ? {
                    ...prev,
                    name: response.data.name || prev.name,
                    profileImage: response.data.profileImage || prev.profileImage,
                  } : null);
                }
              } catch (err) {
                // Silently ignore - the user is still logged in, just may not have their name/photo
                console.warn("Could not fetch full profile on initial load", err);
              }
            };
            fetchProfile();
          }
        } else {
          // Token is expired, clear it
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      } catch (error) {
        console.error("Invalid stored token", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }
    setIsLoading(false);
  }, []);

  // Set up axios interceptor to handle 401s globally
  // Use a ref to always call the latest logout function
  useEffect(() => {
    logoutRef.current = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setToken(null);
      setUser(null);
    };
  });

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only auto-logout if we have a token (i.e., user was logged in)
          const currentToken = localStorage.getItem("access_token");
          if (currentToken) {
            logoutRef.current();
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = (newToken: string, refreshToken: string) => {
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("refresh_token", refreshToken);
    setToken(newToken);

    try {
      const decoded: any = jwtDecode(newToken);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name || "Admin",
        role: decoded.role,
        profileImage: decoded.profileImage,
        mustChangePassword: decoded.mustChangePassword,
      });
    } catch (error) {
      console.error("Failed to decode token on login", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const response = await api.get(`/users/${user.id}`);
      const userData = response.data;
      setUser({
        id: userData.id,
        email: userData.email,
         name: userData.name || "Admin",
        role: userData.role,
        profileImage: userData.profileImage,
        mustChangePassword: userData.mustChangePassword,
      });
    } catch (error) {
      console.error("Failed to refresh user data", error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  return (
    <AuthContext.Provider
        value={{
          user,
          token,
          login,
          logout,
          refreshUser,
          updateUser,
          isAuthenticated: !!token,
          isLoading,
        }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
