import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

// Components & Providers
import PostCard from '../../components/blog/PostCard';
import PostCardSkeleton from '../../components/blog/PostCardSkeleton';
import ScreenContainer from '../../components/layout/ScreenContainer';
import { Colors } from '../../constants/Colors';
import { useAuthContext } from '../../providers/AuthProvider';

// API
import { fetchData } from '../../api/api';

// Type Definitions
interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: { likes: number; dislikes: number };
  views: number;
  imageUrl?: string;
}

interface ApiResponse {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
}

// Define how many posts to show per page
const POSTS_PER_PAGE = 10;

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const mapWithImages = useCallback((items: Post[]) => {
    return items.map((post) => ({
      ...post,
      imageUrl: `https://picsum.photos/id/${post.id % 100}/400/200`,
    }));
  }, []);

  const loadInitial = useCallback(async () => {
    setPostsLoading(true);
    setError(null);
    isLoadingRef.current = true;
    try {
      const response = await fetchData(POSTS_PER_PAGE, 0);
      const items = mapWithImages(response.posts);
      setPosts(items);
      setTotal(response.total);
      setSkip(response.limit);
      setHasMore(response.limit < response.total);
    } catch (err) {
      setError('Failed to fetch posts. Please try again later.');
    } finally {
      setPostsLoading(false);
      isLoadingRef.current = false;
    }
  }, [mapWithImages]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || isFetchingMore || !hasMore) return;
    
    // Small delay to ensure smooth scroll experience
    setTimeout(() => {
      setIsFetchingMore(true);
    }, 100);
    
    setError(null);
    isLoadingRef.current = true;
    try {
      const response = await fetchData(POSTS_PER_PAGE, skip);
      const items = mapWithImages(response.posts);
      // Append with de-duplication by id
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...items.filter((p) => !existingIds.has(p.id))];
        return merged;
      });
      const newSkip = skip + response.limit;
      setSkip(newSkip);
      setTotal(response.total);
      setHasMore(newSkip < response.total);
    } catch (err) {
      setError('Failed to fetch more posts. Pull to retry.');
    } finally {
      setIsFetchingMore(false);
      isLoadingRef.current = false;
    }
  }, [hasMore, isFetchingMore, mapWithImages, skip]);

  useEffect(() => {
    if (!authLoading && user) {
      loadInitial();
    }
  }, [authLoading, user, loadInitial]);

  const handleDeletePost = useCallback((postId: number) => {
    console.log('Deleting post with ID:', postId);
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    setTotal((prevTotal) => prevTotal - 1);
  }, []);

  const handleLogout = async () => { /* ... (no changes) ... */ };
  const handleNotificationPress = () => {
    console.log('Notification pressed from Home');
  };

  const ListFooter = useMemo(() => {
    if (isFetchingMore) {
      return (
        <View style={styles.skeletonFooter}>
          <PostCardSkeleton />
          <PostCardSkeleton />
          <View style={styles.extraSpacer} />
        </View>
      );
    }
    return <View style={styles.footerSpacer} />;
  }, [isFetchingMore]);

  return (
    <ScreenContainer onNotificationPress={handleNotificationPress} hasNotifications={false}>
      <FlatList
        data={postsLoading ? Array(5).fill(null) : posts}
        keyExtractor={(item, index) => postsLoading ? `skeleton-${index}` : item.id.toString()}
        renderItem={({ item }) => postsLoading ? <PostCardSkeleton /> : <PostCard item={item} onDelete={handleDeletePost} />}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        removeClippedSubviews={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        ListHeaderComponent={
          <>
            {error && !postsLoading && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={ListFooter}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  // ... (keep all your existing styles for header, loading, error, etc.)
  loadingContainer: { /* ... */ },
  errorContainer: { /* ... */ },
  header: { /* ... */ },
  title: { },
  subtitle: { /* ... */ },
  listContent: {
    marginTop:20,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  footerSpacer: {
    height: 12,
  },
  skeletonFooter: {
    paddingBottom: 50,
  },
  extraSpacer: {
    height: 30,
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  
  // --- NEW STYLES for Pagination ---
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc', // A grey color for disabled state
    opacity: 0.7,
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paginationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default HomeScreen;