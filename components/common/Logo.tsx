import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 30, showText = true }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/zysk-mobile-logo.png')}
        style={[styles.logo, { width: 80, height: size }]}
        resizeMode="contain"
      />
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    borderRadius: 8,
  },
  textContainer: {
    marginLeft: 12,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
});

export default Logo;
