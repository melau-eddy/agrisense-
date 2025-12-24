# AgriSense Design Guidelines

## Architecture Decisions

### Authentication
**Auth Required** - Multi-tenant platform with different user roles:
- **Implementation**: SSO-first approach
  - Apple Sign-In (iOS requirement)
  - Google Sign-In (Android/cross-platform)
  - Mock auth flow in prototype with role selection (Executive, Farm Manager, Field Operator)
- **Account Screen**:
  - User profile with organization details
  - Farm/organization switcher for multi-farm users
  - Role display (non-editable)
  - Privacy policy and terms of service links
  - Settings > Account > Delete account (double confirmation)
  - Log out with confirmation alert

### Navigation
**Tab Navigation** (5 tabs with center action):
1. **Dashboard** - Executive/KPI overview
2. **Fields** - Farm field management and sensor data
3. **Control** (center, emphasized) - Core irrigation control action
4. **Insights** - AI recommendations and analytics
5. **Profile** - User settings and impact metrics

**Secondary Navigation**:
- Drawer for farm/field switching in multi-farm scenarios
- Stack navigation for detailed views (field details, sensor history, compliance logs)

### Screen Specifications

#### 1. Dashboard Screen (Executive View)
- **Purpose**: High-level KPIs for decision-makers and stakeholders
- **Header**: Transparent, farm selector dropdown (left), notification bell (right)
- **Layout**:
  - Scrollable root view with top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
  - Card-based layout for KPI metrics
- **Components**:
  - Summary cards: Water Savings %, Yield Improvement %, Soil Health Score
  - Polished line/bar charts for trend visualization
  - Impact metrics callouts (Water Saved L, CO₂ Reduced kg)
  - Quick action buttons: "View Report", "Schedule Irrigation"
- **Safe Area**: Top and bottom insets for tab bar

#### 2. Fields Screen (Farmer View)
- **Purpose**: Real-time monitoring of soil sensors across fields
- **Header**: Transparent, search bar for filtering fields
- **Layout**:
  - List view of field cards, each showing live sensor data
  - Top inset: headerHeight + Spacing.xl + search bar height
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Field cards with icon-driven sensor displays:
    - Moisture icon + percentage
    - pH icon + value
    - Nutrient icons (N-P-K) + levels
    - Temperature icon + value
  - Status indicators: "Healthy", "Attention Needed", "Critical"
  - Tap card to view detailed field analytics
- **Interaction**: Pull-to-refresh for sensor updates

#### 3. Control Screen (Irrigation Control)
- **Purpose**: Automated irrigation management with compliance tracking
- **Header**: Non-transparent, title "Irrigation Control", settings icon (right)
- **Layout**:
  - Scrollable form-style layout
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Field selector dropdown
  - Master toggle: "Auto Mode" / "Manual Override" with confirmation modal
  - Schedule builder: Time picker, duration, recurrence
  - Real-time status: "Next irrigation: 2h 15m"
  - Historical logs table (read-only compliance records)
  - Submit button: "Save Schedule" (floating at bottom with shadow)
- **Safe Area**: Floating button inset: insets.bottom + tabBarHeight + Spacing.xl
- **Shadow Specs** for floating button:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2

#### 4. Insights Screen (AI Recommendations)
- **Purpose**: AI-driven irrigation and soil management recommendations
- **Header**: Transparent, filter icon (right)
- **Layout**:
  - Scrollable content with card-based recommendations
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - Priority recommendation cards with confidence scores
  - "Apply Recommendation" action buttons
  - Forecast integration: 7-day weather outlook with icons
  - Water optimization suggestions with projected savings
  - Historical recommendation performance metrics
- **Interaction**: Swipe cards for more details or dismiss

#### 5. Profile Screen
- **Purpose**: User settings, farm management, and investor-ready impact reports
- **Header**: Non-transparent, title "Profile"
- **Layout**:
  - Scrollable form
  - Top inset: Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components**:
  - User avatar (custom upload or preset AgriSense-themed avatars)
  - Display name and organization
  - Farm portfolio switcher (for multi-farm accounts)
  - Impact Dashboard section:
    - Total water saved (liters)
    - Total yield increase (%)
    - CO₂ emissions reduced (kg)
  - Settings: Notifications, Units (metric/imperial), Language
  - Account management: Privacy, Terms, Delete Account, Log Out

#### 6. Alerts & Notifications Screen (Modal)
- **Purpose**: View and manage system alerts
- **Navigation**: Accessed via notification bell icon
- **Layout**:
  - Native modal, list of alert cards
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**:
  - Alert cards with severity indicators (Info, Warning, Critical)
  - Concise message: "Irrigation scheduled — 20% water saved"
  - Timestamp and field name
  - Action buttons: "View Details", "Dismiss"
  - Mark all as read option

#### 7. Field Detail Screen (Stack)
- **Purpose**: Deep dive into individual field metrics and sensor history
- **Header**: Non-transparent, back button (left), share icon (right), field name as title
- **Layout**:
  - Scrollable detailed view
  - Top inset: Spacing.xl
  - No bottom inset (no tab bar in stack)
- **Components**:
  - Large sensor value displays with trend indicators
  - Historical charts (24h, 7d, 30d toggles)
  - Sensor health status and last calibration date
  - Manual irrigation trigger button
  - Notes section for field observations

## Design System

### Color Palette
**Professional & Trustworthy with Sustainability Accents**

- **Primary (Brand Green)**: #2D7A4F - Trust, sustainability, growth
- **Primary Variant**: #1E5A39 - Darker shade for active states
- **Accent (Water Blue)**: #4A90E2 - Water, irrigation, clarity
- **Neutral Background**: #F8F9FA - Clean, professional base
- **Surface White**: #FFFFFF - Cards, forms
- **Text Primary**: #1A1A1A - High contrast for readability
- **Text Secondary**: #6B7280 - Supporting text
- **Success Green**: #10B981 - Healthy status
- **Warning Amber**: #F59E0B - Attention needed
- **Critical Red**: #EF4444 - Urgent alerts
- **Border Gray**: #E5E7EB - Subtle separators
- **Chart Colors**: Use accent blue (#4A90E2), primary green (#2D7A4F), and neutral grays for multi-series charts

### Typography
**Sans-serif, Modern, Professional**

- **Headings**: System font (San Francisco for iOS, Roboto for Android)
  - H1: 32px, weight 700 (Dashboard titles)
  - H2: 24px, weight 600 (Section headers)
  - H3: 18px, weight 600 (Card titles)
- **Body**: 
  - Regular: 16px, weight 400
  - Emphasis: 16px, weight 500
- **Caption**: 14px, weight 400 (Metadata, timestamps)
- **Button**: 16px, weight 600, uppercase tracking for primary CTAs
- **Data Display**: Tabular numbers for sensor values

### Visual Design

**Icons**:
- Use Feather icons from @expo/vector-icons for consistency
- Sensor icons: droplet (moisture), thermometer (temp), activity (pH), wind (nutrients)
- Navigation: home, grid, sliders, trending-up, user
- NO emojis — maintain professional aesthetic

**Touchable Feedback**:
- All interactive elements: opacity 0.7 on press
- Buttons: subtle scale animation (0.98) on press
- Cards: no shadow by default; add subtle shadow on press for depth

**Floating Elements**:
- Bottom action buttons use EXACT shadow specifications:
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- Elevated cards (KPI summaries): subtle border instead of heavy shadows

**Charts & Visualizations**:
- Use professional chart library (e.g., Victory Native)
- Clean grid lines, labeled axes
- Smooth animations on data updates
- Export/share functionality for investor presentations

### Critical Assets

**Logo & Branding**:
- Generate AgriSense logo: Minimalist leaf + water droplet fusion in primary green
- Logo placement: Top-left of Dashboard header

**Icons for Sensor Types** (generate as SVG assets):
1. Soil Moisture icon - abstract soil layers with water droplet
2. pH Balance icon - scale/balance symbol
3. Nutrient icon - molecular structure or plant roots
4. Temperature icon - thermometer with green fill

**User Avatars** (generate 4 preset options with agricultural theme):
1. Farmer with hat silhouette
2. Agronomist with clipboard
3. Executive with growth chart
4. Field operator with tools

**Dashboard Graphics**:
- Generate infographic-style iconography for impact metrics (water drop for savings, leaf for CO₂, grain for yield)

### Accessibility & Offline Design

- **Offline Indicator**: Persistent banner when no connection, with "Last synced" timestamp
- **Local Data Caching**: All sensor readings cached, sync icon shows pending uploads
- **Contrast**: WCAG AA minimum for all text/background combinations
- **Touch Targets**: Minimum 44x44pt for all interactive elements
- **Loading States**: Skeleton screens for data-heavy views, professional spinners (not playful)

### Professional Tone & Language

- **Alerts**: Concise, actionable, official tone
  - ✓ "Irrigation scheduled — 20% water saved"
  - ✗ "Great job! You're saving water! 💧"
- **Empty States**: Encouraging but professional
  - "No fields configured yet. Add your first field to begin monitoring."
- **Error Messages**: Clear, solution-oriented
  - "Unable to connect to sensors. Check device connection and try again."
- **Compliance Language**: Formal for logs and reports
  - "Irrigation log recorded at 2024-01-15 14:30 UTC. Duration: 45 min. Volume: 2,500L."