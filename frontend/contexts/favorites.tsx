import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { favoritesAPI } from "../services/api";
import { useAuth } from "./auth";

import { Property } from "../types";

interface FavoritesContextType {
  favorites: string[];
  favoriteProperties: Property[];
  toggleFavorite: (propertyId: string, property?: Property) => Promise<void>;
  isFavorite: (propertyId: string) => boolean;
  loadFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const { user } = useAuth(); // Need user to fetch favorites

  const lastLoadedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.id !== lastLoadedUserId.current) {
        loadFavorites();
        lastLoadedUserId.current = user.id;
      }
    } else {
      if (lastLoadedUserId.current !== null) {
        setFavorites([]);
        setFavoriteProperties([]);
        lastLoadedUserId.current = null;
      }
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      console.log("Loading favorites from API...");
      const response = await favoritesAPI.getAll();
      // Backend returns { id, userId, propertyId, property: { ... } }
      const favoriteIds = response.data.map((fav: any) => fav.propertyId);
      const props = response.data
        .map((fav: any) => fav.property)
        .filter(Boolean);

      console.log("Loaded favorite IDs:", favoriteIds);
      setFavorites(favoriteIds);
      setFavoriteProperties(props);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const toggleFavorite = async (propertyId: string, property?: Property) => {
    if (!user) return;

    const isFav = favorites.includes(propertyId);

    // Optimistic Update
    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== propertyId));
      setFavoriteProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } else {
      setFavorites((prev) => [...prev, propertyId]);
      if (property) {
        setFavoriteProperties((prev) => [...prev, property]);
      }
    }

    try {
      if (isFav) {
        // Remove
        console.log("Removing favorite:", propertyId);
        await favoritesAPI.remove(propertyId);
      } else {
        // Add
        console.log("Adding favorite:", propertyId);
        await favoritesAPI.add(propertyId);
        // If property wasn't provided, reload to get it correctly
        if (!property) {
          loadFavorites();
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Rollback on error
      loadFavorites();
    }
  };

  const isFavorite = (propertyId: string) => {
    return favorites.includes(propertyId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteProperties,
        toggleFavorite,
        isFavorite,
        loadFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};
