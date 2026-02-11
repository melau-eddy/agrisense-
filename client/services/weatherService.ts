// services/weatherService.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const WEATHER_CONFIG = {
  // Choose one provider:
  
  // OpenWeatherMap (recommended)
//   provider: 'openweathermap',
//   apiKey: 'YOUR_OPENWEATHERMAP_API_KEY', // Replace with your key
//   baseUrl: 'https://api.openweathermap.org/data/2.5',
  
//   OR WeatherAPI.com (alternative)
  provider: 'weatherapi',
  apiKey: 'b1facdcf80c248f192064117261102',
  baseUrl: 'https://api.weatherapi.com/v1'
};

// Cache keys
const CACHE_KEYS = {
  FORECAST: '@agrisense_weather_forecast',
  LAST_UPDATED: '@agrisense_weather_last_updated',
};

// Cache duration (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// Default coordinates (fallback)
const DEFAULT_COORDINATES = {
  lat: 37.7749, // San Francisco
  lon: -122.4194,
};

interface WeatherForecastDay {
  date: string;
  dayOfWeek: string;
  condition: string;
  conditionCode: number;
  icon: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  precipitation: number; // in mm
  windSpeed: number;
  sunrise?: string;
  sunset?: string;
  uvIndex?: number;
}

interface WeatherData {
  current: {
    temp: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    feelsLike: number;
    precipitation: number;
    uvIndex: number;
  };
  forecast: WeatherForecastDay[];
  location: string;
  lastUpdated: string;
}

// Helper to get condition icon
const getConditionIcon = (conditionCode: number, isDay: boolean = true): string => {
  // Mapping based on OpenWeatherMap condition codes
  // https://openweathermap.org/weather-conditions
  
  if (conditionCode >= 200 && conditionCode < 300) {
    return 'cloud-lightning'; // Thunderstorm
  } else if (conditionCode >= 300 && conditionCode < 400) {
    return 'cloud-drizzle'; // Drizzle
  } else if (conditionCode >= 500 && conditionCode < 600) {
    return 'cloud-rain'; // Rain
  } else if (conditionCode >= 600 && conditionCode < 700) {
    return 'cloud-snow'; // Snow
  } else if (conditionCode >= 700 && conditionCode < 800) {
    return 'wind'; // Atmosphere (mist, fog, etc.)
  } else if (conditionCode === 800) {
    return isDay ? 'sun' : 'moon'; // Clear
  } else if (conditionCode === 801) {
    return 'cloud'; // Few clouds
  } else if (conditionCode === 802) {
    return 'cloud'; // Scattered clouds
  } else if (conditionCode >= 803 && conditionCode <= 804) {
    return 'cloud'; // Broken/overcast clouds
  }
  
  return 'cloud';
};

// Helper to get condition text
const getConditionText = (conditionCode: number): string => {
  if (conditionCode >= 200 && conditionCode < 300) return 'storm';
  if (conditionCode >= 300 && conditionCode < 400) return 'drizzle';
  if (conditionCode >= 500 && conditionCode < 600) return 'rain';
  if (conditionCode >= 600 && conditionCode < 700) return 'snow';
  if (conditionCode >= 700 && conditionCode < 800) return 'wind';
  if (conditionCode === 800) return 'sunny';
  if (conditionCode === 801) return 'partly-cloudy';
  if (conditionCode === 802) return 'cloudy';
  if (conditionCode >= 803 && conditionCode <= 804) return 'cloudy';
  return 'cloudy';
};

// Save to cache
const saveToCache = async (key: string, data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

// Load from cache
const loadFromCache = async (key: string): Promise<any> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error loading from cache:', error);
    return null;
  }
};

// Check if cache is valid
const isCacheValid = async (): Promise<boolean> => {
  try {
    const lastUpdated = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATED);
    if (!lastUpdated) return false;
    
    const lastUpdateTime = parseInt(lastUpdated, 10);
    const currentTime = Date.now();
    
    return (currentTime - lastUpdateTime) < CACHE_DURATION;
  } catch (error) {
    return false;
  }
};

// Get coordinates from user's farms or use default
const getUserCoordinates = async (): Promise<{ lat: number; lon: number }> => {
  try {
    // Try to get from user's farms first
    const farms = await loadFromCache('@agrisense_farms');
    if (farms && Array.isArray(farms) && farms.length > 0) {
      // Find first farm with coordinates
      const farmWithCoords = farms.find(farm => farm.coordinates);
      if (farmWithCoords?.coordinates) {
        return {
          lat: farmWithCoords.coordinates.latitude,
          lon: farmWithCoords.coordinates.longitude,
        };
      }
    }
    
    // Fallback to default coordinates
    return DEFAULT_COORDINATES;
  } catch (error) {
    return DEFAULT_COORDINATES;
  }
};

// Format temperature (Kelvin to Celsius)
const kelvinToCelsius = (kelvin: number): number => {
  return Math.round(kelvin - 273.15);
};

// Format temperature (Kelvin to Fahrenheit)
const kelvinToFahrenheit = (kelvin: number): number => {
  return Math.round((kelvin - 273.15) * 9/5 + 32);
};

// Get day of week
const getDayOfWeek = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

// Format time
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// OpenWeatherMap API implementation
const getWeatherFromOpenWeatherMap = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    // Get current weather and forecast
    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(`${WEATHER_CONFIG.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: WEATHER_CONFIG.apiKey,
          units: 'metric', // or 'imperial' for Fahrenheit
        },
      }),
      axios.get(`${WEATHER_CONFIG.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: WEATHER_CONFIG.apiKey,
          units: 'metric',
          cnt: 40, // 5 days * 8 intervals per day = 40
        },
      }),
    ]);

    const current = currentResponse.data;
    const forecast = forecastResponse.data;

    // Process forecast data - group by day
    const dailyForecast: WeatherForecastDay[] = [];
    const daysMap = new Map<string, any[]>();

    // Group forecast by date
    forecast.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!daysMap.has(dateKey)) {
        daysMap.set(dateKey, []);
      }
      daysMap.get(dateKey)!.push(item);
    });

    // Create daily forecast for next 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      const dateKey = forecastDate.toISOString().split('T')[0];
      
      const dayItems = daysMap.get(dateKey) || [];
      
      if (dayItems.length > 0) {
        // Calculate min/max temp for the day
        const temps = dayItems.map(item => item.main.temp);
        const tempMax = Math.max(...temps);
        const tempMin = Math.min(...temps);
        
        // Get midday weather for condition
        const middayItem = dayItems.find(item => {
          const hour = new Date(item.dt * 1000).getHours();
          return hour >= 11 && hour <= 14;
        }) || dayItems[Math.floor(dayItems.length / 2)];
        
        // Calculate precipitation
        const precipitation = dayItems.reduce((sum, item) => {
          return sum + (item.rain?.['3h'] || 0) + (item.snow?.['3h'] || 0);
        }, 0);
        
        dailyForecast.push({
          date: dateKey,
          dayOfWeek: i === 0 ? 'Today' : getDayOfWeek(forecastDate),
          condition: getConditionText(middayItem.weather[0].id),
          conditionCode: middayItem.weather[0].id,
          icon: getConditionIcon(middayItem.weather[0].id, true),
          tempMax: Math.round(tempMax),
          tempMin: Math.round(tempMin),
          humidity: middayItem.main.humidity,
          precipitation: Math.round(precipitation),
          windSpeed: Math.round(middayItem.wind.speed * 3.6), // Convert m/s to km/h
        });
      }
    }

    return {
      current: {
        temp: Math.round(current.main.temp),
        condition: getConditionText(current.weather[0].id),
        icon: getConditionIcon(current.weather[0].id, true),
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind.speed * 3.6), // Convert m/s to km/h
        feelsLike: Math.round(current.main.feels_like),
        precipitation: current.rain?.['1h'] || current.snow?.['1h'] || 0,
        uvIndex: 0, // OpenWeatherMap doesn't provide UV in free tier
      },
      forecast: dailyForecast,
      location: current.name || 'Unknown Location',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('OpenWeatherMap API error:', error);
    throw new Error('Failed to fetch weather data');
  }
};

// WeatherAPI.com implementation (alternative)
const getWeatherFromWeatherAPI = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await axios.get(`${WEATHER_CONFIG.baseUrl}/forecast.json`, {
      params: {
        key: WEATHER_CONFIG.apiKey,
        q: `${lat},${lon}`,
        days: 7,
        aqi: 'no',
        alerts: 'no',
      },
    });

    const data = response.data;

    const forecast: WeatherForecastDay[] = data.forecast.forecastday.map((day: any) => ({
      date: day.date,
      dayOfWeek: new Date(day.date).getDate() === new Date().getDate() ? 'Today' : getDayOfWeek(new Date(day.date)),
      condition: day.day.condition.text.toLowerCase(),
      conditionCode: day.day.condition.code,
      icon: getConditionIcon(day.day.condition.code, true),
      tempMax: Math.round(day.day.maxtemp_c),
      tempMin: Math.round(day.day.mintemp_c),
      humidity: day.day.avghumidity,
      precipitation: day.day.totalprecip_mm,
      windSpeed: Math.round(day.day.maxwind_kph),
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset,
      uvIndex: Math.round(day.day.uv),
    }));

    return {
      current: {
        temp: Math.round(data.current.temp_c),
        condition: data.current.condition.text.toLowerCase(),
        icon: getConditionIcon(data.current.condition.code, data.current.is_day === 1),
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_kph),
        feelsLike: Math.round(data.current.feelslike_c),
        precipitation: data.current.precip_mm,
        uvIndex: data.current.uv,
      },
      forecast,
      location: data.location.name,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('WeatherAPI error:', error);
    throw new Error('Failed to fetch weather data');
  }
};

// Main function to get weather data
export const getWeatherForecast = async (useCache: boolean = true): Promise<WeatherData | null> => {
  try {
    // Check cache first
    if (useCache) {
      const isCacheValidResult = await isCacheValid();
      if (isCacheValidResult) {
        const cachedData = await loadFromCache(CACHE_KEYS.FORECAST);
        if (cachedData) {
          console.log('Using cached weather data');
          return cachedData;
        }
      }
    }

    // Get user coordinates
    const coordinates = await getUserCoordinates();
    
    let weatherData: WeatherData;
    
    // Fetch from selected provider
    switch (WEATHER_CONFIG.provider) {
      case 'openweathermap':
        weatherData = await getWeatherFromOpenWeatherMap(coordinates.lat, coordinates.lon);
        break;
      case 'weatherapi':
        weatherData = await getWeatherFromWeatherAPI(coordinates.lat, coordinates.lon);
        break;
      default:
        throw new Error('Invalid weather provider configured');
    }
    
    // Save to cache
    await saveToCache(CACHE_KEYS.FORECAST, weatherData);
    await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATED, Date.now().toString());
    
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    
    // Try to return cached data even if expired
    if (useCache) {
      const cachedData = await loadFromCache(CACHE_KEYS.FORECAST);
      if (cachedData) {
        console.log('Using expired cached weather data due to API error');
        return cachedData;
      }
    }
    
    return null;
  }
};

// Clear weather cache
export const clearWeatherCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.FORECAST);
    await AsyncStorage.removeItem(CACHE_KEYS.LAST_UPDATED);
  } catch (error) {
    console.error('Error clearing weather cache:', error);
  }
};

// Refresh weather data (force update)
export const refreshWeatherForecast = async (): Promise<WeatherData | null> => {
  await clearWeatherCache();
  return await getWeatherForecast(false);
};

// Get weather icon for Feather icons
export const getWeatherIconName = (condition: string): keyof typeof Feather.glyphMap => {
  const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
    'sunny': 'sun',
    'clear': 'sun',
    'partly-cloudy': 'cloud',
    'cloudy': 'cloud',
    'overcast': 'cloud',
    'rain': 'cloud-rain',
    'drizzle': 'cloud-drizzle',
    'snow': 'cloud-snow',
    'storm': 'cloud-lightning',
    'thunderstorm': 'cloud-lightning',
    'wind': 'wind',
    'mist': 'wind',
    'fog': 'wind',
    'haze': 'wind',
  };
  
  return iconMap[condition] || 'cloud';
};
