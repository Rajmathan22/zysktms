import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CardVideoPlayerProps {
  videoSource: string;
  isVisible: boolean;
  onPress: () => void; // This prop comes from PostCard
}

const CardVideoPlayer: React.FC<CardVideoPlayerProps> = ({ 
  videoSource, 
  isVisible, 
  onPress // We receive the onPress prop
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(videoSource, (player) => {
    // Set initial properties for a card feed
    player.muted = true;
    player.loop = true;
  });

  // <-- FIX 1: Removed the duplicate 'player' definition that was here.

  // This logic is simplified for auto-play/pause
  useEffect(() => {
    if (isVisible) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isVisible, player]); // Only depends on visibility

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      
      {/* This overlay now triggers the modal */}
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={onPress} // <-- FIX 2: Added the onPress prop here
        activeOpacity={0.8}
      >
        {/* Show play icon only when paused */}
        {!isPlaying && (
          <View style={styles.iconContainer}>
            <Ionicons name="play" size={30} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 180, 
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    padding: 10,
  },
});

export default CardVideoPlayer;