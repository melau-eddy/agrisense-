// FarmContext.tsx - Updated for Realtime Database
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDatabase, ref, push, set, update, remove, get, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Farm {
  id: string;
  name: string;
  location: string;
  totalAcres: number;
  cropTypes: string[];
  soilType: string;
  irrigationType: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status: 'active' | 'inactive';
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  sensorData?: {
    soilMoisture: number;
    pH: number;
    temperature: number;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    lastUpdated: string;
  };
}

interface FarmContextType {
  farms: Farm[];
  loading: boolean;
  selectedFarm: Farm | null;
  addFarm: (farmData: Omit<Farm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<{ success: boolean; error?: string }>;
  updateFarm: (farmId: string, farmData: Partial<Farm>) => Promise<{ success: boolean; error?: string }>;
  deleteFarm: (farmId: string) => Promise<{ success: boolean; error?: string }>;
  selectFarm: (farm: Farm | null) => void;
  refreshFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

// Storage keys
const FARMS_STORAGE_KEY = '@agrisense_farms';
const SELECTED_FARM_KEY = '@agrisense_selected_farm';

export function FarmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [db] = useState(getDatabase());

  // Load farms from Realtime Database
  const loadFarms = async () => {
    if (!user) {
      setFarms([]);
      setSelectedFarm(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Query farms for current user
      const farmsRef = ref(db, 'farms');
      // We'll filter by userId on the client side since Realtime Database doesn't support complex queries like Firestore
      
      const snapshot = await get(farmsRef);
      const loadedFarms: Farm[] = [];
      
      if (snapshot.exists()) {
        const farmsData = snapshot.val();
        Object.keys(farmsData).forEach((key) => {
          const farm = farmsData[key];
          // Only include farms that belong to the current user
          if (farm.userId === user.uid) {
            loadedFarms.push({
              id: key,
              name: farm.name || '',
              location: farm.location || '',
              totalAcres: farm.totalAcres || 0,
              cropTypes: farm.cropTypes || [],
              soilType: farm.soilType || '',
              irrigationType: farm.irrigationType || '',
              createdAt: farm.createdAt || '',
              updatedAt: farm.updatedAt || '',
              userId: farm.userId,
              status: farm.status || 'active',
              description: farm.description,
              coordinates: farm.coordinates,
              sensorData: farm.sensorData
            });
          }
        });
        
        // Sort by creation date
        loadedFarms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      setFarms(loadedFarms);
      
      // Load selected farm from storage
      const savedSelectedFarm = await AsyncStorage.getItem(SELECTED_FARM_KEY);
      if (savedSelectedFarm) {
        const parsedFarm = JSON.parse(savedSelectedFarm);
        // Verify the farm still exists in the loaded farms and belongs to the user
        const farmExists = loadedFarms.find(farm => farm.id === parsedFarm.id && farm.userId === user.uid);
        if (farmExists) {
          setSelectedFarm(farmExists);
        } else if (loadedFarms.length > 0) {
          // Select first farm if saved farm doesn't exist
          setSelectedFarm(loadedFarms[0]);
          await AsyncStorage.setItem(SELECTED_FARM_KEY, JSON.stringify(loadedFarms[0]));
        }
      } else if (loadedFarms.length > 0) {
        // Select first farm if none saved
        setSelectedFarm(loadedFarms[0]);
        await AsyncStorage.setItem(SELECTED_FARM_KEY, JSON.stringify(loadedFarms[0]));
      }
      
      // Save farms to AsyncStorage for offline use
      await AsyncStorage.setItem(FARMS_STORAGE_KEY, JSON.stringify(loadedFarms));
      
    } catch (error) {
      console.error('Error loading farms:', error);
      
      // Try to load from AsyncStorage as fallback
      try {
        const savedFarms = await AsyncStorage.getItem(FARMS_STORAGE_KEY);
        if (savedFarms) {
          setFarms(JSON.parse(savedFarms));
        }
      } catch (storageError) {
        console.error('Error loading farms from storage:', storageError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a new farm
  const addFarm = async (farmData: Omit<Farm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to add a farm' };
    }

    try {
      const farmWithMetadata = {
        ...farmData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const,
        sensorData: {
          soilMoisture: 0,
          pH: 0,
          temperature: 0,
          nitrogen: 0,
          phosphorus: 0,
          potassium: 0,
          lastUpdated: new Date().toISOString()
        }
      };

      const farmsRef = ref(db, 'farms');
      const newFarmRef = push(farmsRef);
      await set(newFarmRef, farmWithMetadata);
      
      // Create the new farm object with the generated ID
      const newFarm: Farm = {
        id: newFarmRef.key!,
        ...farmWithMetadata,
      };
      
      // Update local state
      setFarms(prev => [newFarm, ...prev]);
      
      // If this is the first farm, select it
      if (farms.length === 0) {
        setSelectedFarm(newFarm);
        await AsyncStorage.setItem(SELECTED_FARM_KEY, JSON.stringify(newFarm));
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error adding farm:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add farm. Please try again.' 
      };
    }
  };

  // Update an existing farm
  const updateFarm = async (farmId: string, farmData: Partial<Farm>): Promise<{ success: boolean; error?: string }> => {
    try {
      const farmRef = ref(db, `farms/${farmId}`);
      await update(farmRef, {
        ...farmData,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setFarms(prev => prev.map(farm => 
        farm.id === farmId 
          ? { ...farm, ...farmData, updatedAt: new Date().toISOString() }
          : farm
      ));
      
      // Update selected farm if it's the one being updated
      if (selectedFarm?.id === farmId) {
        const updatedFarm = { ...selectedFarm, ...farmData, updatedAt: new Date().toISOString() };
        setSelectedFarm(updatedFarm);
        await AsyncStorage.setItem(SELECTED_FARM_KEY, JSON.stringify(updatedFarm));
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating farm:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update farm. Please try again.' 
      };
    }
  };

  // Delete a farm
  const deleteFarm = async (farmId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if this is the selected farm
      const isSelectedFarm = selectedFarm?.id === farmId;
      
      const farmRef = ref(db, `farms/${farmId}`);
      await remove(farmRef);
      
      // Update local state
      setFarms(prev => prev.filter(farm => farm.id !== farmId));
      
      // Handle selected farm if it was deleted
      if (isSelectedFarm) {
        const remainingFarms = farms.filter(farm => farm.id !== farmId);
        if (remainingFarms.length > 0) {
          setSelectedFarm(remainingFarms[0]);
          await AsyncStorage.setItem(SELECTED_FARM_KEY, JSON.stringify(remainingFarms[0]));
        } else {
          setSelectedFarm(null);
          await AsyncStorage.removeItem(SELECTED_FARM_KEY);
        }
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting farm:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete farm. Please try again.' 
      };
    }
  };

  // Select a farm
  const selectFarm = async (farm: Farm | null) => {
    setSelectedFarm(farm);
    if (farm) {
      await AsyncStorage.setItem(SELECTED_FARM_KEY, JSON.stringify(farm));
    } else {
      await AsyncStorage.removeItem(SELECTED_FARM_KEY);
    }
  };

  // Refresh farms
  const refreshFarms = async () => {
    await loadFarms();
  };

  // Load farms when user changes
  useEffect(() => {
    loadFarms();
  }, [user]);

  const value: FarmContextType = {
    farms,
    loading,
    selectedFarm,
    addFarm,
    updateFarm,
    deleteFarm,
    selectFarm,
    refreshFarms,
  };

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarms() {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarms must be used within a FarmProvider');
  }
  return context;
}
