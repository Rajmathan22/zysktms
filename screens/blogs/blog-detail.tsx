import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { fetchPostById } from '../../api/api';
import LottieLoader from '../../components/common/LottieLoader'; // <-- 1. IMPORT
import ScreenContainer from '../../components/layout/ScreenContainer';

const BlogDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showReadMore, setShowReadMore] = useState<boolean>(false);
  const { height: windowHeight } = useWindowDimensions();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(Number(id)),
    enabled: !!id,
  });

  const readTime = useMemo(() => {
    // ... (your useMemo code is fine)
    const safeBody = data?.body || '';
    const safeTitle = data?.title || '';
    const words = safeBody.split(/\s+/).filter(Boolean).length + safeTitle.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }, [data?.body, data?.title]);

  const computedId = data?.id ?? (Number(id) || 0);
  const heroUri = `https://picsum.photos/id/${computedId % 100}/800/600`;
  const publishedOn = 'October 4, 2021';

  return (
    <ScreenContainer>
      <LottieLoader visible={isLoading} />

      {isError && (
        <View className='flex-1 justify-center items-center p-4'>
          <Text className='text-red-500 text-center mb-4'>
            {error?.message || 'Failed to load post details.'}
          </Text>
        </View>
      )}

      
      {!isLoading && !isError && data && (
        <ScrollView
          className='flex-1 pb-24'
          onContentSizeChange={(w, h) => {
            const shouldShow = h > windowHeight * 1.05;
            if (shouldShow !== showReadMore) setShowReadMore(shouldShow);
          }}
        >
          <View className='pt-12 px-2'>
            <Image 
              source={{ uri: heroUri }} 
              className='w-full h-[220] rounded-[16] overflow-hidden' 
            />
          </View>
          <View className='px-4 pt-16'>
            <View className='flex-row items-center mb-3'>
              <Text className='text-[12px] text-[#6E6E6E]'>{publishedOn}</Text>
              <Text className='text-[12px] text-[#6E6E6E] mx-[6px]'> • </Text>
              <Text className='text-[12px] text-[#6E6E6E]'>{readTime}</Text>
            </View>
            <Text
              className='text-[28px] leading-[34px] mb-3 text-[#121212] tracking-[0.2px]'
              style={{ fontFamily: 'Nunito-Bold' }}
            >
              {data.title}
            </Text>
            <Text
              className='text-[16px] leading-[26px] mt-[2px] mb-5 text-[#3A3A3A] tracking-[0.1px]'
              style={{ fontFamily: 'Nunito-Regular' }}
            >
              {data.body}
            </Text>
          </View>
          {showReadMore ? (
            <View className='px-5 pt-2 pb-2'>
              <TouchableOpacity activeOpacity={0.85} className='bg-[#161616] rounded-[14px] items-center justify-center py-4'>
                <Text className='text-white font-semibold'>Read More</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

export default BlogDetailScreen;