
// contexts/WeatherContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getWeatherForecast, refreshWeatherForecast, WeatherData } from '@/services/weatherService';

interface WeatherContextType {
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
  refreshWeather: () => Promise<void>;
  lastUpdated: string | null;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getWeatherForecast();
      
      if (data) {
        setWeatherData(data);
        setLastUpdated(data.lastUpdated);
      } else {
        setError('Unable to fetch weather data');
      }
    } catch (err) {
      console.error('Error loading weather data:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const refreshWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await refreshWeatherForecast();
      
      if (data) {
        setWeatherData(data);
        setLastUpdated(data.lastUpdated);
      } else {
        setError('Unable to refresh weather data');
      }
    } catch (err) {
      console.error('Error refreshing weather data:', err);
      setError('Failed to refresh weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
    
    // Refresh weather every hour
    const interval = setInterval(() => {
      loadWeatherData();
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(interval);
  }, []);

  const value: WeatherContextType = {
    weatherData,
    loading,
    error,
    refreshWeather,
    lastUpdated,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
