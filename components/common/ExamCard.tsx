import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ExamItem, ExamStatus, statusDisplay } from '../../services/exams';
import Button from './Button';

interface ExamCardProps {
  item: ExamItem;
  onPrimary: (item: ExamItem) => void;
}

function primaryCtaFor(status: ExamStatus): { title: string; variant: 'primary' | 'secondary' | 'disabled' } {
  switch (status) {
    case 'upcoming':
      return { title: 'Take Assessment', variant: 'primary' };
    
    case 'completed':
      return { title: 'Completed', variant: 'disabled' };
    
    default:
      return { title: 'Open', variant: 'primary' };
  }
}

const ExamCard: React.FC<ExamCardProps> = ({ item, onPrimary }) => {
  const statusMeta = statusDisplay(item.status);
  const cta = primaryCtaFor(item.status);
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          
        </View>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.metaRow}>
          {item.startsAtIso && (
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={12} color={Colors.text} />
              <Text style={styles.metaText}>
                {new Date(item.startsAtIso).toLocaleString()}
              </Text>
            </View>
          )}
          {item.durationMinutes ? (
            <View style={styles.metaPill}>
              <Ionicons name="hourglass-outline" size={12} color={Colors.text} />
              <Text style={styles.metaText}>{item.durationMinutes} min</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.footerRow}>
          <View style={[styles.badge, { backgroundColor: `${statusMeta.color}22` }]}> 
            <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
          <View style={styles.ctaWrap}>
            <Button title={cta.title} onPress={() => onPrimary(item)} variant={cta.variant} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  thumb: {
    width: 68,
    height: 92,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#DDD',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  desc: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: Colors.text,
    opacity: 0.8,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  metaText: {
    fontSize: 11,
    marginLeft: 4,
    color: Colors.text,
    opacity: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
  },
  ctaWrap: {
    flex: 1,
    marginLeft: 10,
  },
});

export default ExamCard;


