import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect } from 'react';
import { Button, SafeAreaView, StyleSheet, View } from 'react-native';

interface FullScreenVideoPlayerProps {
  videoSource: string;
  onClose: () => void;
}

const FullScreenVideoPlayer: React.FC<FullScreenVideoPlayerProps> = ({
  videoSource,
  onClose,
}) => {
  const player = useVideoPlayer(videoSource, (player) => {
    player.muted = false; 
    player.loop = false;
  });

  useEffect(() => {
    player.play();
  }, [player]);

  return (
    <SafeAreaView style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain" 
        allowsFullscreen 
        allowsPictureInPicture
      />
      <View style={styles.closeButton}>
        <Button title="Close" onPress={onClose} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
});

export default FullScreenVideoPlayer;