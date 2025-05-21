import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext'; // Your existing auth context to get token

type Room = {
  id: string | number;
  name: string;
  description:string,
  messages:[],
  created_at:any
  // add other room props if needed
};

type Message = {
  id: string | number;
  text: string;
  user: string; // or userId
  createdAt: string;
  // other message props
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
  setCurrentRoom: React.Dispatch<React.SetStateAction<Room | null>>;  // Added here
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken: token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = "http://192.168.43.234:8000"; // Replace with your base URL or env var

  // Fetch list of rooms
  const fetchRooms = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/chat/rooms/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load rooms");
      const data = await res.json();
      console.log(data,'rooms');
      
      setRooms(data);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a room
  const fetchMessages = async (roomId: string | number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/chat/rooms/${roomId}/messages/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send message to room
  const sendMessage = async (roomId: string | number, text: string) => {
    if (!token) return;
    try {
       const formData = new FormData();
    formData.append('content', text);
    formData.append('room', String(roomId));
      const res = await fetch(`${baseUrl}/api/chat/messages/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'application/json',
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to send message");
      const newMessage = await res.json();
      setMessages(prev => [...prev, newMessage]);
    } catch (err: any) {
      Alert.alert("Error", err.message);
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
        setCurrentRoom,  // <-- Added here
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};
