import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Share, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthContext } from '../../providers/AuthProvider';

import Button from '../common/Button';
import CardVideoPlayer from './CardVideoPlayer';

interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: { likes: number; dislikes: number };
  views: number;
  imageUrl?: string;
  videoUrl?: string; 
}

interface PostCardProps {
  item: Post;
  onDelete?: (id: number) => void;
  isVisible: boolean; 
  onVideoPress: (source: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ item, onDelete, isVisible, onVideoPress }) => {
  const router = useRouter();
  
  const handleViewFullPost = () => {
    router.push({ pathname: '/blogs/[id]', params: { id: String(item.id) } });
  };

  const handleShare = async () => {
    try {
      const url = Linking.createURL(`/blogs/${String(item.id)}`);
      const title = item.title ?? 'Check out this post';
      const message = `${title}\n${url}`;
      await Share.share({ message, title });
    } catch (error) {
      console.warn('Share failed', error);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
  };

  const { role } = useAuthContext();

  return (
    <View className="bg-white rounded-xl mb-4 mr-4 ml-4 mt-2 overflow-hidden shadow-lg border border-gray-200">
      <View className="absolute top-2.5 right-2.5 z-10 flex-row gap-2">
        <TouchableOpacity onPress={handleShare} className="bg-white/80 p-1.5 rounded-full">
          <MaterialIcons name="share" size={20} color="#4B5563" />
        </TouchableOpacity>
        {role === 'admin' && onDelete && (
          <TouchableOpacity onPress={handleDelete} className="bg-white/80 p-1.5 rounded-full">
            <MaterialIcons name="delete" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      
      {item.videoUrl ? (
        <CardVideoPlayer 
          videoSource={item.videoUrl!} 
          isVisible={isVisible} 
          onPress={() => onVideoPress(item.videoUrl!)} 
        />
      ) : item.imageUrl ? (
        <Image 
          source={{ uri: item.imageUrl }} 
          className="w-full"
          style={{ height: 180, resizeMode: 'cover' }}
          onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
          onLoad={() => console.log('Image loaded successfully:', item.imageUrl)}
        />
      ) : null}
      
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Nunito-Bold' }}>
          {item.title}
        </Text>
        
        <Text 
          className="text-base text-gray-600 leading-6 mb-1" 
          numberOfLines={3}
          style={{ fontFamily: 'Nunito-Regular' }}
        >
          {item.body}
        </Text>

        <View className="flex-row justify-between items-center mt-4 border-t border-gray-100 pt-2.5">
          <Text 
            className="text-sm text-blue-600 italic flex-shrink mr-2.5" 
            numberOfLines={1}
          >
            Tags: {item.tags.join(', ')}
          </Text>
          <Text className="text-sm text-blue-600 font-medium">
            ❤️ {item.reactions.likes} | 👀 {item.views}
          </Text>
        </View>

        <View className="mt-4">
            <Button title="View Full Blog" onPress={handleViewFullPost} />
        </View>
      </View>
    </View>
  );
};

export default PostCard;