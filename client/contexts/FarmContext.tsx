import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
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
  createdAt: any;
  updatedAt: any;
  userId: string;
  status: 'active' | 'inactive';
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
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

  // Convert Firestore document to Farm object
  const documentToFarm = (doc: QueryDocumentSnapshot<DocumentData>): Farm => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      location: data.location || '',
      totalAcres: data.totalAcres || 0,
      cropTypes: data.cropTypes || [],
      soilType: data.soilType || '',
      irrigationType: data.irrigationType || '',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      userId: data.userId,
      status: data.status || 'active',
      description: data.description,
      coordinates: data.coordinates,
    };
  };

  // Load farms from Firestore
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
      const farmsRef = collection(db, 'farms');
      const q = query(
        farmsRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const loadedFarms: Farm[] = [];
      
      querySnapshot.forEach((doc) => {
        loadedFarms.push(documentToFarm(doc));
      });
      
      setFarms(loadedFarms);
      
      // Load selected farm from storage
      const savedSelectedFarm = await AsyncStorage.getItem(SELECTED_FARM_KEY);
      if (savedSelectedFarm) {
        const parsedFarm = JSON.parse(savedSelectedFarm);
        // Verify the farm still exists in the loaded farms
        const farmExists = loadedFarms.find(farm => farm.id === parsedFarm.id);
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active' as const,
      };

      const docRef = await addDoc(collection(db, 'farms'), farmWithMetadata);
      
      // Create the new farm object with the generated ID
      const newFarm: Farm = {
        id: docRef.id,
        ...farmWithMetadata,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const farmRef = doc(db, 'farms', farmId);
      await updateDoc(farmRef, {
        ...farmData,
        updatedAt: serverTimestamp(),
      });
      
      // Update local state
      setFarms(prev => prev.map(farm => 
        farm.id === farmId 
          ? { ...farm, ...farmData, updatedAt: new Date() }
          : farm
      ));
      
      // Update selected farm if it's the one being updated
      if (selectedFarm?.id === farmId) {
        const updatedFarm = { ...selectedFarm, ...farmData, updatedAt: new Date() };
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
      
      await deleteDoc(doc(db, 'farms', farmId));
      
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