import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  Text,
  TouchableOpacity,
  View,
  ViewabilityConfig,
  ViewToken
} from 'react-native';

import InstaStory from 'react-native-insta-story';

// Components & Providers
import FullScreenVideoPlayer from '../../components/blog/FullScreenVideoPlayer';
import PostCard from '../../components/blog/PostCard';
import PostCardSkeleton from '../../components/blog/PostCardSkeleton';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { useAuthContext } from '../../providers/AuthProvider';

// API
import { Colors } from '@/constants/Colors';
import { fetchData } from '../../api/api';

// --- This is your new media URL ---
const VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

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

  const [modalVideoSource, setModalVideoSource] = useState<string | null>(null);

  const handleOpenVideoModal = useCallback((source: string) => {
    setModalVideoSource(source);
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
        imageUrl: `https://picsum.photos/id/${post.id % 100}/400/200`,
        videoUrl: undefined,
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

  const data = [
  {
    user_id: 1,
    user_image:
      'https://pbs.twimg.com/profile_images/1222140802475773952/61OmyINj.jpg',
    user_name: 'Ahmet Çağlar',
    stories: [
      {
        story_id: 101,
        story_image:
          'https://image.freepik.com/free-vector/universe-mobile-wallpaper-with-planets_79603-600.jpg',
        swipeText: 'Swipe to see more',
        onPress: () => console.log('story 1 swiped'),
      },
    ],
  },
  {
    user_id: 2,
    user_image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    user_name: 'Sarah Jones',
    stories: [
      {
        story_id: 201,
        story_image:
          'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=600&fit=crop',
        swipeText: 'Read article',
      },
      {
        story_id: 202,
        story_image:
          'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 3,
    user_image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    user_name: 'Mike Chen',
    stories: [
      {
        story_id: 301,
        story_image:
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 4,
    user_image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    user_name: 'Emily White',
    stories: [
      {
        story_id: 401,
        story_image:
          'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&fit=crop',
      },
      {
        story_id: 402,
        story_image:
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 5,
    user_image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    user_name: 'David Miller',
    stories: [
      {
        story_id: 501,
        story_image:
          'https://images.unsplash.com/photo-1530103862676-de3c9a64db2b?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 6,
    user_image:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop',
    user_name: 'Jessica Brown',
    stories: [
      {
        story_id: 601,
        story_image:
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&fit=crop',
      },
      {
        story_id: 602,
        story_image:
          'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 7,
    user_image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    user_name: 'Ryan Wilson',
    stories: [
      {
        story_id: 701,
        story_image:
          'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 8,
    user_image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    user_name: 'Olivia Taylor',
    stories: [
      {
        story_id: 801,
        story_image:
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 9,
    user_image:
      'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=400&fit=crop',
    user_name: 'Daniel Moore',
    stories: [
      {
        story_id: 901,
        story_image:
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 10,
    user_image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
    user_name: 'Sophia A.',
    stories: [
      {
        story_id: 1001,
        story_image:
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&fit=crop',
      },
    ],
  },
  {
    user_id: 11,
    user_image:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
    user_name: 'James T.',
    stories: [
      {
        story_id: 1101,
        story_image:
          'https://images.unsplash.com/photo-1511920160042-a95088f9c169?w=600&fit=crop',
      },
    ],
  },
];

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
            <InstaStory
              avatarSize={65}
              avatarWrapperStyle={{ marginRight: 8 }}
              unPressedBorderColor={Colors.primary}
              pressedBorderColor="#e5e7eb"
              style={{ padding: 12 }}
              data={data}
              duration={10}
            />
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
          className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg android:elevation-8 z-10"
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