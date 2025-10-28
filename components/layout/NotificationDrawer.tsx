import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  unread?: boolean;
}

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  width?: number; // optional fixed width; defaults to 86% of screen width
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ visible, onClose, notifications = [], width }) => {
  const translateX = useRef(new Animated.Value(1)).current; // 1 -> hidden (off-screen), 0 -> visible
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const fallbackWidth = Math.floor(Dimensions.get('window').width * 0.86);
  const drawerWidth = useMemo(() => (width && width > 0 ? width : fallbackWidth), [width, fallbackWidth]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 1,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, backdropOpacity]);

  const sampleNotifications: NotificationItem[] = [
    { id: '1', title: 'Project Alpha Deadline', description: 'Final report is due tomorrow morning.', time: '5m ago', unread: true },
    { id: '2', title: 'New Comment on Your Post', description: 'Sarah commented: "Great insights! Let\'s discuss this."', time: '15m ago', unread: true },
    { id: '3', title: 'Password Has Been Changed', description: 'Your password for the account was successfully updated.', time: '1h ago',unread: true },
    { id: '4', title: 'Team Meeting Reminder', description: 'Weekly sync-up meeting starts in 30 minutes.', time: '1h ago', unread: true },
    { id: '5', title: 'Welcome to ZYSK TMS', description: 'Thanks for joining our platform! We\'re glad to have you. 🎉', time: '3h ago' },
    { id: '6', title: 'New Task Assigned', description: 'You have been assigned the task "Design new login screen".', time: '5h ago' },
    { id: '7', title: 'Server Maintenance Alert', description: 'Scheduled maintenance will occur tonight at 11 PM.', time: 'Yesterday' },
    { id: '8', title: 'New Feature: Dark Mode!', description: 'You can now enable dark mode in the settings.', time: 'Yesterday', unread: true },
    { id: '9', title: 'Security Alert', description: 'A new login to your account was detected from a new device.', time: '2d ago' },
    { id: '10', title: 'John Doe sent you a message', description: 'Hey, do you have a minute to review the latest wireframes?', time: '2d ago' },
    { id: '11', title: 'Invoice #INV-2025-101 Paid', description: 'Your recent invoice has been successfully paid.', time: 'Oct 12' },
    { id: '12', title: 'Friend Request Accepted', description: 'Emily Smith has accepted your friend request.', time: 'Oct 12' },
    { id: '13', title: 'Your Weekly Report is Ready', description: 'View your activity and progress for the last week.', time: 'Oct 10' },
    { id: '14', title: 'Profile Information Updated', description: 'Your contact email was changed successfully.', time: 'Oct 9' },
    { id: '15', title: 'Course "React Native Pro" Completed', description: 'Congratulations on completing the course! Your certificate is available.', time: 'Oct 8' },
    { id: '16', title: 'New Blog Post Available', description: 'Check out "10 Tips for Better State Management".', time: 'Oct 8' },
    { id: '17', title: 'File Upload Successful', description: 'Your file "project-brief.pdf" has been uploaded.', time: 'Oct 7' },
    { id: '18', title: 'System Update v2.5.1', description: 'A new version of the application is available for download.', time: 'Oct 6' },
    { id: '19', title: 'Your Subscription is Expiring', description: 'Your Pro plan will expire in 3 days. Renew now!', time: 'Oct 5' },
    { id: '20', title: 'Happy Anniversary!', description: 'You\'ve been a member for 1 year. Thanks for being with us!', time: 'Oct 4' },
];

  const dataToRender = notifications.length > 0 ? notifications : sampleNotifications;

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, drawerWidth],
                }),
              },
            ],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </Pressable>
          </View>

          <FlatList
            data={dataToRender}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <View style={[styles.itemRow, item.unread && styles.itemUnread] }>
                <View style={styles.itemIconWrap}>
                  <Ionicons name="notifications" size={18} color={item.unread ? Colors.primary : Colors.grey} />
                </View>
                <View style={styles.itemContent}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    {!!item.time && <Text style={styles.itemTime}>{item.time}</Text>}
                  </View>
                  {!!item.description && (
                    <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
                  )}
                </View>
                {item.unread && <View style={styles.unreadDot} />}
              </View>
            )}
          />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(75,123,236,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: 'Nunito-Bold',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F2F3F5',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  separator: {
    height: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  itemUnread: {
    borderColor: Colors.primary,
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Nunito-Bold',
    flex: 1,
    marginRight: 8,
  },
  itemTime: {
    fontSize: 12,
    color: Colors.grey,
  },
  itemDescription: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.grey,
    fontFamily: 'Nunito-Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
    marginTop: 6,
  },
});

export default NotificationDrawer;


