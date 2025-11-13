import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { Colors } from '../../constants/Colors';
import { useAuthContext } from '../../providers/AuthProvider';

const ProfileScreen = () => {
  const { user, loading: authLoading, logout } = useAuthContext();
  const handleNotificationPress = () => {
    console.log('Notification pressed from profile');
  };

  const profileOptions = [
    { id: 1, title: 'Favourites', icon: 'heart-outline' as const },
    { id: 2, title: 'Downloads', icon: 'download-outline' as const },
    { id: 3, title: 'Language', icon: 'globe-outline' as const },
    { id: 4, title: 'Location', icon: 'location-outline' as const },
    { id: 5, title: 'Subscription', icon: 'card-outline' as const },
    { id: 6, title: 'Clear cache', icon: 'trash-outline' as const },
    { id: 7, title: 'Clear history', icon: 'time-outline' as const },
  ];

  const handleName = user?.displayName || 'Unknown';
  const userEmail = user?.email || 'username@example.com';

  return (
    <ScreenContainer 
      onNotificationPress={handleNotificationPress}
      hasNotifications={false}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarContainer}>
                {user?.photoURL ? (
                  <Image 
                    source={{ uri: user.photoURL }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={40} color={Colors.white} />
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={Colors.white} />
              </View>
            </View>
            <View style={styles.userTextArea}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{handleName}</Text>
              <Text style={styles.userHandle} numberOfLines={1} ellipsizeMode="tail">{userEmail}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.optionsContainer}>
            {profileOptions.map((option) => (
              <TouchableOpacity key={option.id} activeOpacity={0.7} style={styles.optionItem}>
                <View style={styles.optionLeft}>
                  <View style={styles.optionIconWrap}>
                    <Ionicons name={option.icon} size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.grey} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.logoutCard}>
          <TouchableOpacity activeOpacity={0.7} style={styles.logoutRow} onPress={logout}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIconWrap, { backgroundColor: Colors.logoutcolor }]}>
                <Ionicons name="log-out-outline" size={20} color={Colors.logouttextcolor} />
              </View>
              <Text style={styles.logoutText}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userTextArea: {
    flex: 1,
    minWidth: 0, // allow text to shrink within row
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    color: Colors.text,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: Colors.grey,
    flexShrink: 1,
  },
  // removed edit button styles
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  optionsContainer: {
    paddingHorizontal: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.profilesection,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: Colors.text,
    marginLeft: 12,
  },
  logoutCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 30,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutRow: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.error || Colors.logouttextcolor,
    marginLeft: 12,
    fontFamily: 'Nunito-Bold',
  },
});

export default ProfileScreen;
