import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import ExamCard from '../../components/common/ExamCard';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { Colors } from '../../constants/Colors';
import { ExamItem, ExamStatus, fetchExams } from '../../services/exams';

const ExamsScreen = () => {
  const router = useRouter();
  const handleNotificationPress = () => {
    console.log('Notification pressed from exams');
  };

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExamItem[]>([]);
  const [filter, setFilter] = useState<'all' | ExamStatus>('all');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const data = await fetchExams();
      setItems(data.items);
      setLoading(false);
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const upcoming = items.filter((i) => i.status === 'upcoming').length;
    return { total, completed, upcoming };
  }, [items]);

  const handlePrimary = (item: ExamItem) => {
    // Always navigate; assessment screen handles resume/completion checks
    router.push({ pathname: '/assessment', params: { id: item.id, name: item.title } });
  };

  return (
    <ScreenContainer 
      onNotificationPress={handleNotificationPress}
      hasNotifications={false}
    >
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.subtitle}>Prepare and take your professional exams</Text>
              <View style={styles.filterRow}>
                {(
                  [
                    { k: 'all', label: 'All' },
                    { k: 'upcoming', label: 'Upcoming' },
                    { k: 'completed', label: 'Completed' },
                    
                  ] as const
                ).map((f) => (
                  <Pressable
                    key={f.k}
                    onPress={() => setFilter(f.k as any)}
                    style={[
                      styles.chip,
                      filter === f.k && styles.chipActive,
                    ]}
                  >
                    <Text style={[styles.chipText, filter === f.k && styles.chipTextActive]}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>{stats.upcoming}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </View>
            {loading && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <ExamCard item={item} onPrimary={handlePrimary} />
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  chipTextActive: {
    color: Colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grey,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.grey,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default ExamsScreen;
