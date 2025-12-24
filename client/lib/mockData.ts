export interface Field {
  id: string;
  name: string;
  acres: number;
  status: "healthy" | "attention" | "critical";
  moisture: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  lastIrrigation: string;
}

export interface Alert {
  id: string;
  type: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp: string;
  fieldName: string;
  read: boolean;
}

export interface IrrigationLog {
  id: string;
  fieldId: string;
  fieldName: string;
  timestamp: string;
  duration: number;
  volume: number;
  mode: "auto" | "manual";
}

export interface Recommendation {
  id: string;
  fieldId: string;
  fieldName: string;
  type: "irrigation" | "nutrient" | "soil";
  title: string;
  description: string;
  confidence: number;
  savings: number;
  priority: "high" | "medium" | "low";
}

export const mockFields: Field[] = [
  {
    id: "1",
    name: "North Valley Plot",
    acres: 45,
    status: "healthy",
    moisture: 72,
    ph: 6.8,
    nitrogen: 85,
    phosphorus: 62,
    potassium: 78,
    temperature: 24,
    lastIrrigation: "2h ago",
  },
  {
    id: "2",
    name: "East Ridge Section",
    acres: 32,
    status: "attention",
    moisture: 45,
    ph: 7.2,
    nitrogen: 58,
    phosphorus: 71,
    potassium: 65,
    temperature: 26,
    lastIrrigation: "6h ago",
  },
  {
    id: "3",
    name: "South Creek Farm",
    acres: 78,
    status: "healthy",
    moisture: 68,
    ph: 6.5,
    nitrogen: 92,
    phosphorus: 55,
    potassium: 82,
    temperature: 23,
    lastIrrigation: "3h ago",
  },
  {
    id: "4",
    name: "West Meadow",
    acres: 25,
    status: "critical",
    moisture: 28,
    ph: 5.8,
    nitrogen: 42,
    phosphorus: 38,
    potassium: 45,
    temperature: 28,
    lastIrrigation: "12h ago",
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "info",
    title: "Irrigation Complete",
    message: "Scheduled irrigation completed — 18% water saved",
    timestamp: "10 min ago",
    fieldName: "North Valley Plot",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Low Moisture Detected",
    message: "Soil moisture below optimal levels. Consider irrigation.",
    timestamp: "1h ago",
    fieldName: "East Ridge Section",
    read: false,
  },
  {
    id: "3",
    type: "critical",
    title: "Immediate Action Required",
    message: "Critical moisture levels detected. Irrigation recommended.",
    timestamp: "2h ago",
    fieldName: "West Meadow",
    read: true,
  },
  {
    id: "4",
    type: "info",
    title: "Sensor Calibrated",
    message: "pH sensor successfully recalibrated",
    timestamp: "5h ago",
    fieldName: "South Creek Farm",
    read: true,
  },
];

export const mockIrrigationLogs: IrrigationLog[] = [
  {
    id: "1",
    fieldId: "1",
    fieldName: "North Valley Plot",
    timestamp: "2024-01-15 14:30",
    duration: 45,
    volume: 2500,
    mode: "auto",
  },
  {
    id: "2",
    fieldId: "3",
    fieldName: "South Creek Farm",
    timestamp: "2024-01-15 12:15",
    duration: 60,
    volume: 4200,
    mode: "auto",
  },
  {
    id: "3",
    fieldId: "2",
    fieldName: "East Ridge Section",
    timestamp: "2024-01-15 08:00",
    duration: 30,
    volume: 1800,
    mode: "manual",
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: "1",
    fieldId: "2",
    fieldName: "East Ridge Section",
    type: "irrigation",
    title: "Optimize Irrigation Timing",
    description:
      "Shift irrigation to early morning to reduce evaporation loss by 22%",
    confidence: 94,
    savings: 22,
    priority: "high",
  },
  {
    id: "2",
    fieldId: "4",
    fieldName: "West Meadow",
    type: "irrigation",
    title: "Urgent: Increase Watering",
    description: "Critical moisture levels require immediate irrigation cycle",
    confidence: 98,
    savings: 0,
    priority: "high",
  },
  {
    id: "3",
    fieldId: "1",
    fieldName: "North Valley Plot",
    type: "nutrient",
    title: "Phosphorus Boost Recommended",
    description: "Add phosphorus-rich fertilizer to improve yield by 8%",
    confidence: 87,
    savings: 8,
    priority: "medium",
  },
  {
    id: "4",
    fieldId: "3",
    fieldName: "South Creek Farm",
    type: "soil",
    title: "Reduce Irrigation Duration",
    description: "Current moisture optimal. Reduce next cycle by 15 minutes.",
    confidence: 91,
    savings: 15,
    priority: "low",
  },
];

export const mockKPIs = {
  waterSavings: 23,
  yieldImprovement: 18,
  soilHealthScore: 87,
  totalWaterSaved: 125000,
  co2Reduced: 450,
  activeFields: 4,
  totalAcres: 180,
};

export const mockWeatherForecast = [
  { day: "Today", temp: 24, condition: "sunny", rain: 0 },
  { day: "Tue", temp: 22, condition: "cloudy", rain: 10 },
  { day: "Wed", temp: 20, condition: "rain", rain: 60 },
  { day: "Thu", temp: 19, condition: "rain", rain: 45 },
  { day: "Fri", temp: 23, condition: "cloudy", rain: 5 },
  { day: "Sat", temp: 25, condition: "sunny", rain: 0 },
  { day: "Sun", temp: 26, condition: "sunny", rain: 0 },
];
