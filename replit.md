# AgriSense - AI-Powered Smart Irrigation Platform

## Overview
AgriSense is a professional, market-ready mobile application for smart irrigation and soil health management. The app serves farmers, agribusinesses, and government partners with an executive-grade interface that balances sophistication with accessibility.

## Current State
**Phase**: Frontend Prototype Complete
**Status**: Fully functional design prototype with mock data

## Technology Stack
- **Frontend**: React Native with Expo SDK 54
- **Navigation**: React Navigation 7 with bottom tab navigator
- **State Management**: React Query for data fetching patterns
- **Styling**: Custom theme system with professional color palette
- **Backend**: Express.js (ready for API integration)
- **Database**: PostgreSQL with Drizzle ORM (schema ready)

## Project Structure
```
client/
├── components/          # Reusable UI components
│   ├── AlertCard.tsx    # Notification/alert display
│   ├── Button.tsx       # Primary action button
│   ├── Card.tsx         # Base card component
│   ├── FieldCard.tsx    # Field sensor data display
│   ├── HeaderTitle.tsx  # App branding header
│   ├── KPICard.tsx      # KPI metrics display
│   ├── RecommendationCard.tsx  # AI recommendation cards
│   └── ...
├── constants/
│   └── theme.ts         # Design tokens (colors, spacing, typography)
├── hooks/               # Custom React hooks
├── lib/
│   ├── mockData.ts      # Mock sensor/farm data
│   └── query-client.ts  # API configuration
├── navigation/
│   ├── MainTabNavigator.tsx    # Bottom tab navigation
│   └── RootStackNavigator.tsx  # Stack navigation
├── screens/
│   ├── DashboardScreen.tsx     # Executive KPI overview
│   ├── FieldsScreen.tsx        # Field monitoring list
│   ├── ControlScreen.tsx       # Irrigation control panel
│   ├── InsightsScreen.tsx      # AI recommendations
│   ├── ProfileScreen.tsx       # User settings & impact
│   ├── NotificationsScreen.tsx # Alerts modal
│   └── FieldDetailScreen.tsx   # Detailed field view
└── App.tsx              # App entry point

server/
├── index.ts             # Express server entry
├── routes.ts            # API route definitions
└── storage.ts           # Database interface

shared/
└── schema.ts            # Drizzle database schema
```

## Features Implemented

### Dashboard Screen
- Executive KPI cards (water savings, yield improvement, soil health)
- Impact metrics display (liters saved, CO₂ reduced)
- 7-day weather forecast with precipitation indicators
- Field summary with status indicators

### Fields Screen
- Searchable field list with real-time sensor data
- Status badges (Healthy, Attention, Critical)
- Sensor readings: moisture, pH, temperature, nutrients
- Navigation to detailed field view

### Control Screen
- Field selector dropdown
- Auto/Manual mode toggle with confirmation
- Schedule time and duration pickers
- Recent irrigation logs with compliance info
- Floating action buttons for save/start

### Insights Screen
- Weather outlook with 5-day forecast
- Filterable AI recommendations by type
- Priority badges and confidence scores
- Apply recommendation actions

### Profile Screen
- User profile with organization info
- Impact dashboard metrics
- Farm portfolio management
- Settings (notifications, units, language)
- Account management options

### Field Detail Screen
- Comprehensive sensor readings grid
- Time range toggles (24H, 7D, 30D)
- Sensor health status
- Manual irrigation trigger

## Design System
- **Primary Green**: #2D7A4F (trust, sustainability)
- **Accent Blue**: #4A90E2 (water, clarity)
- **Professional typography**: System fonts with hierarchy
- **Touch feedback**: Spring animations, scale effects
- **Border-based elevation**: No heavy shadows

## Next Steps (Backend Integration)
1. Set up database schema for fields, sensors, users
2. Implement REST API endpoints for CRUD operations
3. Connect frontend to live data sources
4. Add real sensor data integration (MQTT/REST)
5. Implement authentication (Apple/Google Sign-In)
6. Add push notification support
7. Weather API integration for live forecasts
