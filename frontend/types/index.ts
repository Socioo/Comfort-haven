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
  hostId: string;
  hostName: string;
  hostPhoto?: string;
  rating: number;
  reviewCount: number;
  latitude?: number;
  longitude?: number;
  availableDates: string[];
}

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  checkIn: Date | string;
  checkOut: Date | string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}