import { PostDetail } from '@/types/home';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { fetchPostById } from '../api/api';
import ScreenContainer from '../components/layout/ScreenContainer';
import { Colors } from '../constants/Colors';


const BlogDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReadMore, setShowReadMore] = useState<boolean>(false);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const getPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchPostById(Number(id));
        setPost(data);
      } catch (err) {
        setError('Failed to fetch post details.');
      } finally {
        setLoading(false);
      }
    };
    getPost();
  }, [id]);

  const readTime = useMemo(() => {
    const safeBody = post?.body || '';
    const safeTitle = post?.title || '';
    const words = safeBody.split(/\s+/).filter(Boolean).length + safeTitle.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }, [post?.body, post?.title]);

  const computedId = post?.id ?? (Number(id) || 0);
  const heroUri = `https://picsum.photos/id/${computedId % 100}/800/600`;
  const publishedOn = 'October 4, 2021';

  if (loading) {
    return (
      <ScreenContainer>
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !post) {
    return (
      <ScreenContainer>
        <View 
        className='flex-1 justify-center items-center'
        >
          <Text className='text-[#B00020] text-[16px]'>{error || 'Post not found.'}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className='flex-1 pb-24'
        onContentSizeChange={(w, h) => {
          const shouldShow = h > windowHeight * 1.05;
          if (shouldShow !== showReadMore) setShowReadMore(shouldShow);
        }}
      >
        <View 
        className='pt-12 px-2'
        >
          <Image source={{ uri: heroUri }} 
          className='w-full h-[220] rounded-[16] overflow-hidden'
          />
        </View>
        <View 
        className='px-4 pt-16'>
          <View className='flex-row items-center mb-3'>
            <Text className='text-[12px] text-[#6E6E6E]'>{publishedOn}</Text>
            <Text className='text-[12px] text-[#6E6E6E] mx-[6px]'> • </Text>
            <Text className='text-[12px] text-[#6E6E6E]'>{readTime}</Text>
          </View>
          <Text 
            className='text-[28px] leading-[34px] mb-3 text-[#121212] tracking-[0.2px]'
            style={{ fontFamily: 'Nunito-Bold' }}
          >
            {post.title}
          </Text>
          <Text 
            className='text-[16px] leading-[26px] mt-[2px] mb-5 text-[#3A3A3A] tracking-[0.1px]'
            style={{ fontFamily: 'Nunito-Regular' }}
          >
            {post.body}
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
    </ScreenContainer>
  );
};

 

export default BlogDetailScreen;
