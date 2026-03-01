export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  lga: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  images: string[];
  amenities: string[];
  rating: number;
  reviewCount: number;
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  availableDates: string[];
  ownerId?: string; // Backend field
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  date: string;
}