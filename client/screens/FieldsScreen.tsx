import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { getDatabase, ref, get, onValue, off } from "firebase/database";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FieldCard } from "@/components/FieldCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Farm {
  id: string;
  name: string;
  location: string;
  totalAcres: number;
  cropTypes: string[];
  soilType: string;
  irrigationType: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'healthy' | 'attention' | 'critical';
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

export default function FieldsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  
  const db = getDatabase();

  useEffect(() => {
    loadFarmsFromDatabase();
    return () => {
      // Clean up listeners
    };
  }, []);

  const loadFarmsFromDatabase = async () => {
    try {
      setLoading(true);
      const farmsRef = ref(db, 'farms');
      
      // Set up real-time listener
      const unsubscribe = onValue(farmsRef, (snapshot) => {
        if (snapshot.exists()) {
          const farmsData = snapshot.val();
          const farmsArray: Farm[] = Object.keys(farmsData).map(key => ({
            id: key,
            ...farmsData[key]
          }));
          setFarms(farmsArray);
        } else {
          setFarms([]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error loading farms:', error);
        setLoading(false);
      });

      return () => {
        off(farmsRef);
      };
    } catch (error) {
      console.error('Error loading farms:', error);
      setLoading(false);
    }
  };

  const filteredFarms = farms.filter((farm) =>
    farm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAcres = farms.reduce((sum, farm) => sum + farm.totalAcres, 0);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading farms...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">Farms</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {farms.length} farm{farms.length !== 1 ? 's' : ''} | {totalAcres} total acres
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search farms..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Feather
              name="x"
              size={18}
              color={theme.textSecondary}
              onPress={() => setSearchQuery("")}
            />
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredFarms}
        renderItem={({ item }) => (
          <FieldCard
            field={item}
            onPress={() => navigation.navigate("FieldDetail", { fieldId: item.id })}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="map" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No Farms Added
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Add your first farm to start monitoring
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    marginTop: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  separator: {
    height: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
    gap: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});