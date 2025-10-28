import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors'; // Assuming you have this file

interface AddIconProps {
  onPress?: () => void;
  size?: number;
}

const AddIcon: React.FC<AddIconProps> = ({ onPress, size = 24 }) => {
  return (
    <Pressable 
      style={styles.container} 
      onPress={onPress}
      android_ripple={{ color: Colors.primary || '#DDDDDD', radius: 24 }}
    >
      <Ionicons 
        name="add-circle-outline" 
        size={size} 
        color={Colors.text || '#000'} 
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent', // Matches NotificationBell
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddIcon;