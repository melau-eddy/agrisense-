import { createAlert, createSystemAlert } from './firebaseNotifications';

export async function generateIrrigationAlert(
  userId: string,
  fieldName: string,
  moistureLevel: number,
  threshold: number
): Promise<void> {
  const isCritical = moistureLevel < threshold * 0.5;
  
  await createAlert({
    userId,
    title: isCritical ? '🚨 Critical: Low Soil Moisture' : '⚠️ Low Soil Moisture',
    message: `Field "${fieldName}" has moisture level at ${moistureLevel}%, which is below the optimal threshold of ${threshold}%.`,
    type: isCritical ? 'critical' : 'warning',
    category: 'irrigation',
    priority: isCritical ? 'high' : 'medium',
    data: {
      fieldName,
      moistureLevel,
      threshold,
      action: 'schedule_irrigation',
      timestamp: new Date().toISOString(),
    },
    actionUrl: '/control', // Deep link to irrigation control
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
}

export async function generateWeatherAlert(
  userId: string,
  forecast: {
    condition: string;
    temperature: number;
    rainChance: number;
    windSpeed: number;
  },
  impact: string
): Promise<void> {
  const isSevere = forecast.rainChance > 70 || forecast.windSpeed > 30;
  
  await createAlert({
    userId,
    title: isSevere ? '🌪️ Severe Weather Alert' : '🌤️ Weather Update',
    message: `${forecast.condition} expected with ${forecast.rainChance}% rain chance and ${forecast.temperature}°C. Impact: ${impact}`,
    type: isSevere ? 'warning' : 'info',
    category: 'weather',
    priority: isSevere ? 'high' : 'low',
    data: {
      condition: forecast.condition,
      temperature: forecast.temperature,
      rainChance: forecast.rainChance,
      windSpeed: forecast.windSpeed,
      impact,
      timestamp: new Date().toISOString(),
    },
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
  });
}

export async function generateCropHealthAlert(
  userId: string,
  fieldName: string,
  cropType: string,
  issue: string,
  severity: 'low' | 'medium' | 'high'
): Promise<void> {
  const type = severity === 'high' ? 'critical' : severity === 'medium' ? 'warning' : 'info';
  
  await createAlert({
    userId,
    title: `${severity === 'high' ? '🚨 ' : '⚠️ '}Crop Health Issue: ${cropType}`,
    message: `Potential ${issue} detected in ${fieldName} (${cropType}). Immediate attention ${severity === 'high' ? 'required' : 'recommended'}.`,
    type,
    category: 'crop',
    priority: severity,
    data: {
      fieldName,
      cropType,
      issue,
      severity,
      action: 'view_field_details',
      timestamp: new Date().toISOString(),
    },
    actionUrl: `/field/${fieldName}`,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
  });
}

export async function generateSystemAlert(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'critical' | 'success',
  category: 'system' | 'security',
  priority: 'low' | 'medium' | 'high',
  data?: Record<string, any>
): Promise<void> {
  await createSystemAlert(
    title,
    message,
    type,
    category,
    priority,
    data,
    72 // 72 hours expiration
  );
}

export async function generateIrrigationCompleteAlert(
  userId: string,
  fieldName: string,
  volume: number,
  duration: number
): Promise<void> {
  await createAlert({
    userId,
    title: '✅ Irrigation Complete',
    message: `${fieldName} irrigation finished successfully. ${volume}L delivered over ${duration} minutes.`,
    type: 'success',
    category: 'irrigation',
    priority: 'low',
    data: {
      fieldName,
      volume,
      duration,
      timestamp: new Date().toISOString(),
    },
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
  });
}

export async function generateMarketUpdateAlert(
  userId: string,
  cropType: string,
  priceChange: number,
  trend: 'up' | 'down' | 'stable'
): Promise<void> {
  const emoji = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  const type = Math.abs(priceChange) > 10 ? 'warning' : 'info';
  
  await createAlert({
    userId,
    title: `${emoji} Market Update: ${cropType}`,
    message: `${cropType} prices ${trend} by ${Math.abs(priceChange)}%. ${trend === 'up' ? 'Consider selling' : trend === 'down' ? 'Consider holding' : 'Prices stable'}.`,
    type,
    category: 'market',
    priority: 'low',
    data: {
      cropType,
      priceChange,
      trend,
      timestamp: new Date().toISOString(),
    },
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
}