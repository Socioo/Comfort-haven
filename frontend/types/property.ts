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
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}