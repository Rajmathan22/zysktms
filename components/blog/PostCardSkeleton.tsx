import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const PostCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, [shimmerAnim]);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={styles.postCard}>
      {/* Image Skeleton */}
      <Animated.View style={[styles.imageSkeleton, shimmerStyle]} />
      
      <View style={styles.postContent}>
        {/* Title Skeleton */}
        <Animated.View style={[styles.titleSkeleton, shimmerStyle]} />
        
        {/* Body Skeleton - 3 lines */}
        <Animated.View style={[styles.bodySkeleton, shimmerStyle]} />
        <Animated.View style={[styles.bodySkeleton, styles.bodySkeletonShort, shimmerStyle]} />
        <Animated.View style={[styles.bodySkeleton, styles.bodySkeletonMedium, shimmerStyle]} />
        
        <View style={styles.postDetails}>
          {/* Tags Skeleton */}
          <Animated.View style={[styles.tagsSkeleton, shimmerStyle]} />
          
          {/* Reactions Skeleton */}
          <Animated.View style={[styles.reactionsSkeleton, shimmerStyle]} />
        </View>
        
        {/* Button Skeleton */}
        <Animated.View style={[styles.buttonSkeleton, shimmerStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageSkeleton: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  postContent: {
    padding: 15,
  },
  titleSkeleton: {
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
    width: '80%',
  },
  bodySkeleton: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
  },
  bodySkeletonShort: {
    width: '60%',
  },
  bodySkeletonMedium: {
    width: '85%',
  },
  postDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  tagsSkeleton: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: 100,
  },
  reactionsSkeleton: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: 80,
  },
  buttonSkeleton: {
    height: 44,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 15,
  },
});

export default PostCardSkeleton;
