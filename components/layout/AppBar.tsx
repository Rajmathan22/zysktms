import { useAuthContext } from '@/providers/AuthProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import AddIcon from '../common/AddIcon'; // Our new component
import Logo from '../common/Logo';
import NotificationBell from '../common/NotificationBell';

interface AppBarProps {
  onNotificationPress?: () => void;
  hasNotifications?: boolean;
  showLogo?: boolean;
  showNotifications?: boolean;
  onAddPress?: () => void;
  showAddIcon?: boolean;
}

  
  

const AppBar: React.FC<AppBarProps> = ({
  onNotificationPress,
  hasNotifications = true,
  showLogo = true,
  showNotifications = true,
  onAddPress,
  showAddIcon = true,
}) => {
  const insets = useSafeAreaInsets();

  // Handler for notification press can be simplified if not needed
  const handleNotificationPress = () => {
    if (onNotificationPress) onNotificationPress();
  };

    const { role } = useAuthContext();

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {showLogo && (
          <View style={styles.logoContainer}>
            <Logo size={58} showText={true} />
          </View>
        )}
        
        <View style={styles.iconsContainer}>
          {/* Use the new AddIcon directly */}
          {showAddIcon && role==='admin' && <AddIcon onPress={onAddPress} size={28} />}
          
          {/* Use your new NotificationBell directly */}
          {showNotifications && (
            <NotificationBell 
              onPress={handleNotificationPress}
              hasNotifications={hasNotifications}
              size={24}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 56,
  },
  logoContainer: {
    flex: 1,
    marginRight: 16,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // The 'iconWrapper' style is no longer needed and can be deleted.
});

export default AppBar;