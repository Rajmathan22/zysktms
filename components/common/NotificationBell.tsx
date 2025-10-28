import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface NotificationBellProps {
  onPress?: () => void;
  hasNotifications?: boolean;
  size?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  onPress, 
  hasNotifications = false, 
  size = 24 
}) => {
  return (
    <Pressable 
      style={styles.container} 
      onPress={onPress}
      android_ripple={{ color: Colors.primary, radius: 20 }}
    >
      <Ionicons 
        name="notifications-outline" 
        size={size} 
        color={Colors.text} 
      />
      {hasNotifications && <View style={styles.badge} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

export default NotificationBell;
