import { createBlogPost } from '@/api/api';
import ScreenContainer from '@/components/layout/ScreenContainer';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../../components/common/Button';
import { useRouter } from 'expo-router';

type PickedImage = {
  uri: string;
  width?: number;
  height?: number;
};

const MAX_CONTENT_LENGTH = 8000;

const CreatePostScreen: React.FC = () => {
  const router = useRouter();
  const [featuredImage, setFeaturedImage] = useState<PickedImage | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const contentCount = useMemo(() => content.length, [content]);

  const requestPickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to select a featured image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    if (!result.canceled) {
      const picked = result.assets[0];
      setFeaturedImage({ uri: picked.uri, width: picked.width, height: picked.height });
    }
  };

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing fields', 'Title and Content are required.');
      return;
    }
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    try {
      setSubmitting(true);
      const res = await createBlogPost({
        title: title.trim(),
        body: content.trim(),
        category: category.trim() || undefined,
        tags: tags.length ? tags : undefined,
      });
      Alert.alert(
        'Success',
        `Post published with id: ${res?.id ?? 'N/A'}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
      setFeaturedImage(null);
      setTitle('');
      setCategory('');
      setTagsText('');
      setContent('');
    } catch (err: any) {
      Alert.alert('Error', err?.message ? String(err.message) : 'Failed to publish the post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      showAppBar={true}
      hasNotifications={true}
      appBarProps={{
        showLogo: true,
        showNotifications: true,
      }}
    >
      
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="items-center mb-5">
          {/* <Text className="text-3xl text-[#08A0F7] font-extrabold" style={{ fontFamily: 'Nunito-Bold' }}>Create New Blog Post</Text> */}
          {/* <Text className="text-gray-500 mt-1" style={{ fontFamily: 'Nunito-Regular' }}>Share your thoughts with the world</Text> */}
        </View>

        {/* Card */}
        <View className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          {/* Featured Image */}
          <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Nunito-SemiBold' }}>Featured Image</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={requestPickImage}
            className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 items-center justify-center h-44 mb-5"
          >
            {featuredImage ? (
              <Image source={{ uri: featuredImage.uri }} className="w-full h-full rounded-lg" style={{ resizeMode: 'cover' }} />
            ) : (
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-[#E8F4FF] items-center justify-center mb-2">
                  <Ionicons name="cloud-upload-outline" size={26} color="#08A0F7" />
                </View>
                <Text className="text-gray-600" style={{ fontFamily: 'Nunito-Regular' }}>
                  Drop your image here, or <Text className="text-[#08A0F7]">browse</Text>
                </Text>
                <Text className="text-[11px] text-gray-400 mt-1" style={{ fontFamily: 'Nunito-Regular' }}>
                  Supports: JPG, PNG, WEBP (max 5MB)
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Nunito-SemiBold' }}>
            Title <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter your blog post title..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-4 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />

          {/* Category & Tags */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Nunito-SemiBold' }}>Category</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Technology, Lifestyle"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-4 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Nunito-SemiBold' }}>Tags</Text>
              <TextInput
                value={tagsText}
                onChangeText={setTagsText}
                placeholder="e.g., react, web-dev, tutorial"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 mb-4 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Content */}
          <Text className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Nunito-SemiBold' }}>
            Content <Text className="text-red-500">*</Text>
          </Text>
          <View className="rounded-lg border border-gray-300 bg-white">
            <TextInput
              value={content}
              onChangeText={(t) => t.length <= MAX_CONTENT_LENGTH && setContent(t)}
              placeholder="Write your blog post content here..."
              className="min-h-[180px] px-3 py-3 text-gray-800"
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />
            <View className="px-3 pb-2">
              <Text className="text-[11px] text-gray-400" style={{ fontFamily: 'Nunito-Regular' }}>{contentCount} characters</Text>
            </View>
          </View>

          {/* Submit */}
          <View className="mt-5">
            <Button title="Publish Blog Post" onPress={onSubmit} loading={submitting} />
          </View>
        </View>
      </ScrollView>
      </ScreenContainer>
  
  );
};

export default CreatePostScreen;


