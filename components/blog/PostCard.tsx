import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Share, Text, TouchableOpacity, View } from 'react-native';

import { useAuthContext } from '../../providers/AuthProvider';

import Button from '../common/Button';


interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: { likes: number; dislikes: number };
  views: number;
  imageUrl?: string;
}

interface PostCardProps {
  item: Post;
  onDelete?: (id: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ item, onDelete }) => {
  const router = useRouter();
  
  console.log('PostCard item:', { id: item.id, title: item.title, imageUrl: item.imageUrl });

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
    <View className="bg-white rounded-xl mb-4 overflow-hidden shadow-lg border border-gray-200">
      {}
      <View className="absolute top-2.5 right-2.5 z-10 flex-row gap-2">
        <TouchableOpacity 
          className="bg-white/90 rounded-full w-7 h-7 justify-center items-center shadow-sm mr-2"
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={18} color="#1f2937" />
        </TouchableOpacity>
        {onDelete && role === 'admin' &&(
          <TouchableOpacity 
            className="bg-white/90 rounded-full w-7 h-7 justify-center items-center shadow-sm"
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
      
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          className="w-full"
          style={{ height: 180, resizeMode: 'cover' }}
          onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
          onLoad={() => console.log('Image loaded successfully:', item.imageUrl)}
        />
      )}
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

        {/* View Blog Button */}
        <View className="mt-4">
            <Button title="View Full Blog" onPress={handleViewFullPost} />
        </View>
      </View>
    </View>
  );
};

export default PostCard;