import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useFarms } from '@/contexts/FarmContext';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function FarmsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { farms, loading, selectedFarm, selectFarm, refreshFarms, deleteFarm } = useFarms();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFarms();
    setRefreshing(false);
  };

  const handleDeleteFarm = (farmId: string, farmName: string) => {
    Alert.alert(
      'Delete Farm',
      `Are you sure you want to delete "${farmName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteFarm(farmId);
            if (result.success) {
              Alert.alert('Success', 'Farm deleted successfully.');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete farm.');
            }
          },
        },
      ]
    );
  };

  const renderFarmItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.farmCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: item.id === selectedFarm?.id ? theme.primary : theme.border,
          borderWidth: item.id === selectedFarm?.id ? 2 : 1,
        },
      ]}
      onPress={() => selectFarm(item)}
      onLongPress={() => handleDeleteFarm(item.id, item.name)}
    >
      <View style={styles.farmHeader}>
        <View style={styles.farmTitleRow}>
          <Feather name="map-pin" size={20} color={theme.primary} />
          <ThemedText style={styles.farmName}>{item.name}</ThemedText>
          {item.id === selectedFarm?.id && (
            <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteFarm(item.id, item.name)}
          style={styles.deleteButton}
        >
          <Feather name="trash-2" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.farmDetails}>
        <View style={styles.detailRow}>
          <Feather name="map" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
            {item.location}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <Feather name="maximize" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
            {item.totalAcres} acres
          </ThemedText>
        </View>
      </View>

      <View style={styles.farmFooter}>
        <View style={styles.cropContainer}>
          {item.cropTypes.slice(0, 3).map((crop: string, index: number) => (
            <View
              key={index}
              style={[styles.cropChip, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText style={[styles.cropText, { color: theme.text }]}>
                {crop}
              </ThemedText>
            </View>
          ))}
          {item.cropTypes.length > 3 && (
            <View
              style={[styles.cropChip, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText style={[styles.cropText, { color: theme.text }]}>
                +{item.cropTypes.length - 3}
              </ThemedText>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.success + '15' }]}>
          <ThemedText style={[styles.statusText, { color: theme.success }]}>
            {item.status.toUpperCase()}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="h2">My Farms</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {farms.length} farm{farms.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      <FlatList
        data={farms}
        renderItem={renderFarmItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="map" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No Farms Added
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Add your first farm to start monitoring and controlling irrigation
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      />

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddFarm' as never)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 3,
  },
  separator: {
    height: Spacing.md,
  },
  farmCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  farmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  farmDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: 13,
  },
  farmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    flex: 1,
  },
  cropChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  cropText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
  },
  addButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});