import { API_BASE_URL } from '@/utils/config';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext'; // your auth hook

type Room = {
  id: string | number;
  name: string;
  description: string;
};

export type Message = {
  id: string | number;
  content?: string;
  image?: string;
  user: { id: number; username: string };
  created_at: string;
};

type ChatContextType = {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string | number) => Promise<void>;
  sendMessage: (roomId: string | number, text: string) => Promise<void>;
  sendImageMessage: (
    roomId: string | number,
    imageUri: string,
    mimeType?: string
  ) => Promise<void>;
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken: token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = `${API_BASE_URL}/api/chat`;

  // 1. List rooms
  const fetchRooms = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load rooms');
      const data: Room[] = await res.json();
      setRooms(data);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Get messages
  const fetchMessages = async (roomId: string | number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/rooms/${roomId}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data: Message[] = await res.json();
      console.log(data,'-> this is messages to show');
      
      setMessages(data);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Send text
  const sendMessage = async (roomId: string | number, text: string) => {
    if (!token) return;
    try {
      const formData = new FormData();
      formData.append('content', text);
      formData.append('room', String(roomId));

      const res = await fetch(`${baseUrl}/messages/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to send message');
      const newMsg: Message = await res.json();
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  // 4. Send image
  const sendImageMessage = async (
    roomId: string | number,
    imageUri: string,
    mimeType = 'image/jpeg'
  ) => {
    if (!token) return;
    try {
      const formData = new FormData();
      formData.append('room', String(roomId));
      formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: `upload.${mimeType.split('/')[1]}`,
      } as any);

      const res = await fetch(`${baseUrl}/messages/upload_image/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to send image');
      const newMsg: Message = await res.json();
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        rooms,
        currentRoom,
        messages,
        loading,
        error,
        fetchRooms,
        fetchMessages,
        sendMessage,
        sendImageMessage,
        setCurrentRoom,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
