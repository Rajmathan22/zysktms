import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal, // <-- 1. Import Modal
  NativeScrollEvent,
  Text,
  TouchableOpacity,
  View,
  ViewabilityConfig,
  ViewToken
} from 'react-native';

// Components & Providers
import FullScreenVideoPlayer from '../../components/blog/FullScreenVideoPlayer'; // <-- 2. Import FullScreenVideoPlayer
import PostCard from '../../components/blog/PostCard';
import PostCardSkeleton from '../../components/blog/PostCardSkeleton';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { useAuthContext } from '../../providers/AuthProvider';

// API
import { fetchData } from '../../api/api';

// --- This is your new media URL ---
const VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// 1. UPDATED INTERFACE: Added videoUrl
interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: { likes: number; dislikes: number };
  views: number;
  imageUrl?: string;
  videoUrl?: string; // <-- This field is added
}

interface ApiResponse {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
}

const POSTS_PER_PAGE = 10;
const SCROLL_THRESHOLD = 100;
const JITTER_BUFFER = 15; // Pixels

const HomeScreen = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [skip, setSkip] = useState<number>(0);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const [visibleVideoId, setVisibleVideoId] = useState<number | null>(null);

  const listRef = useRef<FlatList<Post> | null>(null);
  const [isFabVisible, setIsFabVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // --- NEW STATE FOR MODAL ---
  const [modalVideoSource, setModalVideoSource] = useState<string | null>(null);

  // --- NEW FUNCTIONS TO CONTROL MODAL ---
  const handleOpenVideoModal = useCallback((source: string) => {
    setModalVideoSource(source);
    // Optional: Pause the visible card video when modal opens
    setVisibleVideoId(null); 
  }, []);

  const handleCloseVideoModal = useCallback(() => {
    setModalVideoSource(null);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handle_videoplayer = () => {
    router.push('/video_player');
  };

  const mapMediaToPosts = useCallback((items: Post[]) => {
    return items.map((post) => {
      if (post.id % 5 === 0) { 
        return {
          ...post,
          videoUrl: VIDEO_URL,
          imageUrl: undefined, 
        };
      }
      
      return {
        ...post,
        imageUrl: `https://picsum.photos/id/${post.id % 100}/400/200`, // Assign image
        videoUrl: undefined, // Ensure video is undefined
      };
    });
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      const firstVisibleItem = viewableItems[0];
      
      if (firstVisibleItem && firstVisibleItem.isViewable && firstVisibleItem.item) {
        const visiblePost = firstVisibleItem.item as Post;
        if (visiblePost.videoUrl) {
          setVisibleVideoId(visiblePost.id);
        } else {
          setVisibleVideoId(null);
        }
      } else {
        setVisibleVideoId(null);
      }
    }
  ).current;

  const viewabilityConfig = useRef<ViewabilityConfig>({
    itemVisiblePercentThreshold: 50, 
  }).current;

  const loadInitial = useCallback(async () => {
    setPostsLoading(true);
    setError(null);
    isLoadingRef.current = true;
    try {
      const response = await fetchData(POSTS_PER_PAGE, 0);
      const items = mapMediaToPosts(response.posts); 
      setPosts(items);
      setTotal(response.total);
      setSkip(items.length);
      setHasMore(response.limit < response.total);
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
    } finally {
      setPostsLoading(false);
      isLoadingRef.current = false;
    }
  }, [mapMediaToPosts]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    setError(null);
    setIsFetchingMore(true);
    isLoadingRef.current = true;
    
    try {
      const response = await fetchData(POSTS_PER_PAGE, skip);
      const items = mapMediaToPosts(response.posts);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = items.filter((p) => !existingIds.has(p.id));
        const merged = [...prev, ...newItems];
        setSkip(merged.length);
        setHasMore(merged.length < response.total);
        setTotal(response.total);
        return merged;
      });
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError('Failed to fetch more posts. Pull to retry.');
    } finally {
      setIsFetchingMore(false);
      isLoadingRef.current = false;
    }
  }, [hasMore, skip, mapMediaToPosts]);


  useEffect(() => {
    if (!authLoading && user) {
      loadInitial();
    }
  }, [authLoading, user, loadInitial]);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
    setTimeout(() => {
      setPostsLoading(true);
      loadInitial();
    }, 400); 
  }, [loadInitial]);

  const handleScroll = useCallback(
    (event: { nativeEvent: NativeScrollEvent }) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const scrollDifference = currentScrollY - lastScrollY;

      if (currentScrollY < SCROLL_THRESHOLD) {
        setIsFabVisible(false);
      }
      else if (scrollDifference < -JITTER_BUFFER) {
        setIsFabVisible(true);
      }
      else if (scrollDifference > JITTER_BUFFER) {
        setIsFabVisible(false);
      }

      if (Math.abs(scrollDifference) > JITTER_BUFFER) {
        setLastScrollY(currentScrollY);
      }
    },
    [lastScrollY]
  );

  const handleDeletePost = useCallback((postId: number) => {
    console.log('Deleting post with ID:', postId);
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    setTotal((prevTotal) => prevTotal - 1);
  }, []);

  const handleNotificationPress = () => {
    console.log('Notification pressed from Home');
  };

  const ListFooter = useMemo(() => {
    if (isFetchingMore) {
      return (
        <View className="space-y-4 pb-8">
          {Array(3).fill(0).map((_, index) => (
            <PostCardSkeleton key={`skeleton-${index}`} />
          ))}
        </View>
      );
    }
    return hasMore ? (
      <View className="py-4 items-center">
        <Text className="text-gray-500">Swipe up to load more</Text>
      </View>
    ) : (
      <View className="py-6 items-center">
        <Text className="text-gray-500">No more posts to show</Text>
      </View>
    );
  }, [isFetchingMore, hasMore]);

  return (
    <ScreenContainer
      onNotificationPress={handleNotificationPress}
      hasNotifications={false}
      appBarProps={{}}
    >
      <FlatList
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={postsLoading ? Array(5).fill(null) : posts}
        keyExtractor={(item, index) =>
          item?.id ? item.id.toString() : `skeleton-${index}`
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => {
          if (!item) {
            return <PostCardSkeleton key={`skeleton-${index}`} />;
          }

          const isVisible = item.videoUrl ? item.id === visibleVideoId : false;
          
          return (
            <PostCard 
              item={item} 
              onDelete={handleDeletePost} 
              isVisible={isVisible} 
              onVideoPress={handleOpenVideoModal} 
            />
          );
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        ListHeaderComponent={
          <>
            {error && !postsLoading && (
              <View className="my-2">
                <Text className="text-red-500 text-base text-center my-2">
                  {error}
                </Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={ListFooter}
        refreshing={postsLoading}
        onRefresh={loadInitial}
      />

      {isFabVisible && (
        <TouchableOpacity
          className="
            absolute bottom-6 right-5 h-14 w-14 
            items-center justify-center rounded-full 
            bg-blue-500 
            shadow-lg android:elevation-8 
            z-10
          "
          onPress={scrollToTop}
          activeOpacity={0.7}
        >
          <Feather name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      )}

      
      <Modal
        visible={!!modalVideoSource}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCloseVideoModal}
      >
        <FullScreenVideoPlayer
          videoSource={modalVideoSource || ''}
          onClose={handleCloseVideoModal}
        />
      </Modal>

    </ScreenContainer>
  );
};

export default HomeScreen;