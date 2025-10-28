import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import AppBar from './AppBar';
import NotificationDrawer from './NotificationDrawer';

interface ScreenContainerProps {
  children: React.ReactNode;
  showAppBar?: boolean;
  onNotificationPress?: () => void;
  hasNotifications?: boolean;
  appBarProps?: {
    showLogo?: boolean;
    showNotifications?: boolean;
  };
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  showAppBar = true,
  onNotificationPress,
  hasNotifications = false,
  appBarProps = {},
}) => {
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawerWidth = useMemo(() => Math.floor(Dimensions.get('window').width * 0.86), []);

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);

  const handleNotificationFromAppBar = useCallback(() => {
    // Call screen-provided handler first
    if (onNotificationPress) {
      try { onNotificationPress(); } catch {}
    }
    // Then open the overlay drawer
    openDrawer();
  }, [onNotificationPress, openDrawer]);
  
  return (
    <View style={styles.container}>
      {showAppBar && (
        <AppBar
          onNotificationPress={handleNotificationFromAppBar}
          hasNotifications={hasNotifications}
          {...appBarProps}
        />
      )}
      <View style={[styles.content, { paddingBottom: insets.bottom }]}>
        {children}
      </View>
      <NotificationDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        width={drawerWidth}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});

export default ScreenContainer;
