interface Post {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: { likes: number; dislikes: number };
  views: number;
  userId: number;
  imageUrl?: string;
}

interface ApiResponse {
  posts: Post[];
  total: number;
  skip: number;
  limit: number;
}

export interface PostDetail {
  id: number;
  title: string;
  body: string;
  tags: string[];
  reactions: { likes: number; dislikes: number };
  views: number;
  userId: number;
}



export default ApiResponse ;
