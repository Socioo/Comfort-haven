import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Property } from '../types';
import { propertiesAPI } from '@/services/api';
import { mockProperties } from '@/mocks/properties';

interface PropertiesContextType {
  properties: Property[];
  isAddingProperty: boolean;
  setIsAddingProperty: (value: boolean) => void;
  addProperty: (property: Omit<Property, 'id' | 'rating' | 'reviewCount'>) => Promise<Property>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<Property>;
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
      const normalizedData = response.data.map((prop: any) => ({
        ...prop,
        hostId: prop.hostId || prop.ownerId // Normalize for frontend
      }));
      setProperties(normalizedData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties(mockProperties); // Fallback
    }
  };

  const addProperty = async (propertyData: any) => {
    setIsAddingProperty(true);
    try {
      // Build a strict whitelist payload matching CreatePropertyDto
      const apiData: Record<string, any> = {
        title: propertyData.title,
        description: propertyData.description,
        price: propertyData.price,
        location: propertyData.location,
        ownerId: propertyData.hostId,
      };
      // Optional fields
      if (propertyData.address !== undefined) apiData.address = propertyData.address;
      if (propertyData.images !== undefined) apiData.images = propertyData.images;
      if (propertyData.amenities !== undefined) apiData.amenities = propertyData.amenities;
      if (propertyData.lga !== undefined) apiData.lga = propertyData.lga;
      if (propertyData.bedrooms !== undefined) apiData.bedrooms = propertyData.bedrooms;
      if (propertyData.bathrooms !== undefined) apiData.bathrooms = propertyData.bathrooms;
      if (propertyData.guests !== undefined) apiData.guests = propertyData.guests;
      if (propertyData.latitude !== undefined) apiData.latitude = propertyData.latitude;
      if (propertyData.longitude !== undefined) apiData.longitude = propertyData.longitude;
      if (propertyData.availableDates !== undefined) apiData.availableDates = propertyData.availableDates;
      
      console.log('[addProperty] API payload:', JSON.stringify(apiData, null, 2));
      const response = await propertiesAPI.create(apiData);
      const newProperty = {
        ...response.data,
        hostId: response.data.hostId || response.data.ownerId
      };
      setProperties((prev: Property[]) => [newProperty, ...prev]);
      return newProperty;
    } catch (error) {
      console.error('Error adding property to API:', error);
      throw error;
    } finally {
      setIsAddingProperty(false);
    }
  };
  
  const updateProperty = async (id: string, updates: any) => {
    try {
      const response = await propertiesAPI.update(id, updates);
      const updatedProp = {
        ...response.data,
        hostId: response.data.hostId || response.data.ownerId
      };
      setProperties((prev: Property[]) => 
        prev.map((p: Property) => p.id === id ? updatedProp : p)
      );
      return updatedProp;
    } catch (error) {
      console.error('Error updating property in API:', error);
      throw error;
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
    return properties.filter((property: Property) => 
      property.hostId === hostId || property.ownerId === hostId
    );
  };

  return (
    <PropertiesContext.Provider
      value={{
        properties,
        isAddingProperty,
        setIsAddingProperty,
        addProperty,
        updateProperty,
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