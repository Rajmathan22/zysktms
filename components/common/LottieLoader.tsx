// ./components/LottieLoader.js

import LottieView from 'lottie-react-native';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

const lottieAnimation = require('../../assets/animations/loading.json');

const LottieLoader = ({ visible = false }) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="none">
      <View style={styles.modalContainer}>
        <View style={styles.animationContainer}>
          <LottieView
            source={lottieAnimation}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
  },
  animationContainer: {
    // You can style this white box if you want
    // For example, to make it a white rounded box:
    // backgroundColor: '#FFFFFF',
    // padding: 20,
    // borderRadius: 10,
  },
  lottieAnimation: {
    width: 150, // Adjust size as needed
    height: 150, // Adjust size as needed
  },
});

export default LottieLoader;