export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  checkIn: Date | string;
  checkOut: Date | string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date | string;
}