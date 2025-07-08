export interface Character {
  id?: number;
  name: string;
  avatarUrl: string;
  status?: string;
}

export interface Chat {
  id: number;
  character?: Character;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  heartCount?: number;
  emotion?: string;
  emotionColor?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatDisplayData {
  id: number;
  character: {
    name: string;
    avatarUrl: string;
    status: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  heartCount: number;
  emotion: string;
  emotionColor: string;
}

export interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
} 