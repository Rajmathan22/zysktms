import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { cssInterop } from 'nativewind';

const PostCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const AView = Animated.View;
  cssInterop(AView, { className: 'style' });

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
    <View className="bg-white rounded-xl mb-[15px] overflow-hidden shadow-md border border-gray-200">
      {/* Image Skeleton */}
      <AView className="w-full h-[180px] bg-gray-200" style={shimmerStyle} />
      
      <View className="p-[15px]">
        {/* Title Skeleton */}
        <AView className="h-6 bg-gray-200 rounded mb-3 w-4/5" style={shimmerStyle} />
        
        {/* Body Skeleton - 3 lines */}
        <AView className="h-4 bg-gray-200 rounded mb-2 w-full" style={shimmerStyle} />
        <AView className="h-4 bg-gray-200 rounded mb-2 w-3/5" style={shimmerStyle} />
        <AView className="h-4 bg-gray-200 rounded mb-2 w-[85%]" style={shimmerStyle} />
        
        <View className="flex-row justify-between items-center mt-[15px] border-t border-gray-100 pt-[10px]">
          {/* Tags Skeleton */}
          <AView className="h-[14px] bg-gray-200 rounded w-[100px]" style={shimmerStyle} />
          
          {/* Reactions Skeleton */}
          <AView className="h-[14px] bg-gray-200 rounded w-[80px]" style={shimmerStyle} />
        </View>
        
        {/* Button Skeleton */}
        <AView className="h-11 bg-gray-200 rounded-lg mt-[15px]" style={shimmerStyle} />
      </View>
    </View>
  );
};

export default PostCardSkeleton;

