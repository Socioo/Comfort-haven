import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Booking } from '../types';

interface BookingsContextType {
  bookings: Booking[];
  isAddingBooking: boolean;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<void>;
  getUserBookings: (userId: string) => Booking[];
}

const BookingsContext = createContext<BookingsContextType | undefined>(undefined);

export const BookingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAddingBooking, setIsAddingBooking] = useState(false);

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    setIsAddingBooking(true);
    try {
      const newBooking: Booking = {
        ...bookingData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      setBookings(prev => [...prev, newBooking]);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsAddingBooking(false);
    }
  };

  const getUserBookings = (userId: string) => {
    return bookings.filter(booking => booking.userId === userId);
  };

  return (
    <BookingsContext.Provider
      value={{
        bookings,
        isAddingBooking,
        addBooking,
        getUserBookings,
      }}
    >
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error('useBookings must be used within BookingsProvider');
  }
  return context;
};