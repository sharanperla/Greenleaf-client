import { useChat } from '@/contexts/ChatContext';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const Community = () => {
  const {
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
  } = useChat();

  const [inputText, setInputText] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [messagesState, setMessages] = useState(messages);
  const yourUserId = 2; // replace with dynamic user.id

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;
    ws.current?.close();
    const wsUrl = `ws://192.168.43.234:8000/ws/chat/${currentRoom.name}/`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      
      if (data.type === 'chat_message') {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Date.now(),
            content: data.message,
            image: data.image,             // if backend returns image URL
            user: { id: data.user_id, username: data.username },
            created_at: data.created_at,
          },
        ]);
      }
    };
    fetchMessages(currentRoom.id);
    return () => ws.current?.close();
  }, [currentRoom]);

  useEffect(() => {
    setMessages(messages);
  }, [messages]);

  const selectRoom = (r: any) => setCurrentRoom(r);

  const handleSendText = () => {
    if (!currentRoom || !inputText.trim()) return;
    sendMessage(currentRoom.id, inputText.trim());
    setInputText('');
  };

  const handlePickImage = async () => {
    if (!currentRoom) return;
    // ask permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll permissions are needed to send images.');
      return;
    }
    // pick
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:'images',
      quality: 0.7,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    // send
     const asset = result.assets[0];
    const uri = asset.uri;
    const mime = asset.type === 'image' ? 'image/jpeg' : asset.type;
    await sendImageMessage(currentRoom.id, uri, mime);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        {/* Rooms list */}
        <Text style={styles.title}>Rooms</Text>
        <ScrollView style={styles.roomsList}>
          {rooms.map((room) => {
            const sel = currentRoom?.id === room.id;
            return (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCard, sel && styles.selectedRoomCard]}
                onPress={() => selectRoom(room)}
              >
                <Text style={[styles.roomName, sel && styles.selectedRoomName]}>
                  {room.name}
                </Text>
                <Text style={styles.roomDescription} numberOfLines={2}>
                  {room.description || 'No description'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Chat area */}
        <View style={styles.chatArea}>
          <Text style={styles.title}>
            {currentRoom ? `Room: ${currentRoom.name}` : 'Select a room'}
          </Text>
          {loading && <Text>Loading...</Text>}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          <ScrollView
            style={styles.messagesContainer}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messagesState.map((msg) => {
              const isOwn = msg.user.id === yourUserId;
              return (
                <View
                  key={msg.id}
                  style={[styles.message, isOwn ? styles.ownMessage : styles.otherMessage]}
                >
                  {!isOwn && <Text style={styles.messageUser}>{msg.user.username}</Text>}
                  {msg.image ? (
                    <Image source={{ uri: msg.image }} style={styles.imageMessage} />
                  ) : (
                    <Text style={styles.messageText}>{msg.content}</Text>
                  )}
                  <Text style={styles.messageTime}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Input bar */}
        {currentRoom && (
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={handlePickImage} style={styles.imageButton}>
              <Text style={{ fontSize: 24 }}>📷</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message…"
              value={inputText}
              onChangeText={setInputText}
            />
            <Button title="Send" onPress={handleSendText} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 5 },
  roomsList: { maxHeight: 150, marginBottom: 10 },
  roomCard: {
    padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8,
  },
  selectedRoomCard: { backgroundColor: '#d0e8ff' },
  roomName: { fontWeight: 'bold', fontSize: 16, color: 'gray' },
  selectedRoomName: { color: '#1a73e8' },
  roomDescription: { fontSize: 14, color: '#555' },

  chatArea: { flex: 1, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 10 },
  messagesContainer: { flex: 1, marginBottom: 10 },
  message: {
    maxWidth: '70%', padding: 8, borderRadius: 10, marginBottom: 8,
  },
  ownMessage: {
    alignSelf: 'flex-start', backgroundColor: '#e5e5ea', borderTopLeftRadius: 0,
  },
  otherMessage: {
    alignSelf: 'flex-end', backgroundColor: '#dcf8c6', borderTopRightRadius: 0,
  },
  messageUser: { fontWeight: 'bold', marginBottom: 2 },
  messageText: { fontSize: 16 },
  imageMessage: { width: 150, height: 100, borderRadius: 8, marginBottom: 4 },
  messageTime: { fontSize: 10, color: '#666', marginTop: 2 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderTopWidth: 1, borderColor: '#ddd',
  },
  imageButton: { padding: 6, marginRight: 8 },
  input: {
    flex: 1, height: 40, borderColor: '#ccc', borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 15, marginRight: 8,
  },
});

export default Community;
