export const unstable_settings = {
  drawer: null,
};

import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { API_BASE_URL } from '@/utils/config';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Button,
    Image,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const getFullImageUri = (path: string) =>
  path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

export default function ChatRoomScreen() {
  const { room } = useLocalSearchParams();
  const { user } = useAuth();
  const {
    sendMessage,
    sendImageMessage,
    fetchMessages,
    messages,
    setCurrentRoom,
    rooms,
  } = useChat();

  

  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState(messages);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const selectedRoom = rooms.find(r => r.name === room);
    if (!selectedRoom) return;

    setCurrentRoom(selectedRoom);
    fetchMessages(selectedRoom.id);

    ws.current = new WebSocket(`ws://192.168.43.234:8000/ws/chat/${room}/`);
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'chat_message') {
        setLocalMessages(prev => [
          ...prev,
          {
            id: data.id || Date.now(),
            content: data.message,
            image: data.image_url ? getFullImageUri(data.image_url) : null,
            user: { id: data.user_id, username: data.username },
            created_at: data.created_at,
          },
        ]);
      }
    };

    return () => ws.current?.close();
  }, [room]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const pickImage = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mime = asset.type ?? 'image/jpeg';
    const selectedRoom = rooms.find(r => r.name === room);
    if (selectedRoom) {
      await sendImageMessage(selectedRoom.id, asset.uri, mime);
    }
  };

  const send = () => {
    if (!inputText.trim()) return;
    const selectedRoom = rooms.find(r => r.name === room);
    if (selectedRoom) {
      sendMessage(selectedRoom.id, inputText.trim());
      setInputText('');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.header}>Room: {room}</Text>

        <ScrollView
          style={styles.messages}
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {localMessages.map((msg) => {
            const isOwn = msg.user.id === user?.id;
            return (
              <View key={msg.id} style={[styles.message, isOwn ? styles.own : styles.other]}>
                {!isOwn && <Text style={styles.username}>{msg.user.username}</Text>}
                {msg.image ? (
                  <Image source={{ uri: msg.image }} style={styles.image} />
                ) : (
                  <Text>{msg.content}</Text>
                )}
                <Text style={styles.timestamp}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage}>
            <Text style={{ fontSize: 24 }}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message"
            value={inputText}
            onChangeText={setInputText}
          />
          <Button title="Send" onPress={send} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  messages: { flex: 1 },
  message: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 5,
    maxWidth: '70%',
  },
  own: { alignSelf: 'flex-end', backgroundColor: '#dcf8c6' },
  other: { alignSelf: 'flex-start', backgroundColor: '#eee' },
  username: { fontWeight: 'bold' },
  image: { width: 150, height: 100, borderRadius: 8 },
  timestamp: { fontSize: 10, color: '#666' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 6,
  },
  input: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
  },
});
