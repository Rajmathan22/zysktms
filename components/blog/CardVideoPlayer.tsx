import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CardVideoPlayerProps {
  videoSource: string;
  isVisible: boolean;
  onPress: () => void; 
}

const CardVideoPlayer: React.FC<CardVideoPlayerProps> = ({ 
  videoSource, 
  isVisible, 
  onPress 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(videoSource, (player) => {
    player.muted = true;
    player.loop = true;
  });


  useEffect(() => {
    if (isVisible) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isVisible, player]); 

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
      
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={onPress} 
        activeOpacity={0.8}
      >
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