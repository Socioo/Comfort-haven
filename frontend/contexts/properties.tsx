import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Property } from '../types';
import { mockProperties } from '@/mocks/properties';

interface PropertiesContextType {
  properties: Property[];
  isAddingProperty: boolean;
  setIsAddingProperty: (value: boolean) => void;
  addProperty: (property: Omit<Property, 'id' | 'rating' | 'reviewCount'>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  getHostProperties: (hostId: string) => Property[];
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export const PropertiesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [isAddingProperty, setIsAddingProperty] = useState(false);

  const addProperty = async (propertyData: Omit<Property, 'id' | 'rating' | 'reviewCount'>) => {
    setIsAddingProperty(true);
    try {
      const newProperty: Property = {
        ...propertyData,
        id: Date.now().toString(),
        rating: 5,
        reviewCount: 0,
      };
      
      setProperties(prev => [...prev, newProperty]);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    } finally {
      setIsAddingProperty(false);
    }
  };

  const deleteProperty = async (id: string) => {
    setProperties(prev => prev.filter(prop => prop.id !== id));
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const getHostProperties = (hostId: string) => {
    return properties.filter(property => property.hostId === hostId);
  };

  return (
    <PropertiesContext.Provider
      value={{
        properties,
        isAddingProperty,
        setIsAddingProperty,
        addProperty,
        deleteProperty,
        getHostProperties,
      }}
    >
      {children}
    </PropertiesContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertiesContext);
  if (!context) {
    throw new Error('useProperties must be used within PropertiesProvider');
  }
  return context;
};