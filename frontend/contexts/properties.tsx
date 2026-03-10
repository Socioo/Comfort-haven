import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Property } from '../types';
import { propertiesAPI } from '@/services/api';
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [isAddingProperty, setIsAddingProperty] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties(mockProperties); // Fallback
    }
  };

  const addProperty = async (propertyData: any) => {
    setIsAddingProperty(true);
    try {
      // Handle the hostId/ownerId mapping if needed
      const apiData = {
        ...propertyData,
        ownerId: propertyData.hostId // Backend expects ownerId
      };
      const response = await propertiesAPI.create(apiData);
      setProperties((prev: Property[]) => [response.data, ...prev]);
    } catch (error) {
      console.error('Error adding property to API:', error);
      throw error;
    } finally {
      setIsAddingProperty(false);
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      await propertiesAPI.delete(id);
      setProperties((prev: Property[]) => prev.filter((prop: Property) => prop.id !== id));
    } catch (error) {
      console.error('Error deleting property from API:', error);
      throw error;
    }
  };

  const getHostProperties = (hostId: string) => {
    return properties.filter((property: Property) => property.hostId === hostId);
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