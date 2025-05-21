import { useChat } from '@/contexts/ChatContext';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
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
    setCurrentRoom,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const ws = useRef<WebSocket | null>(null);

  // Messages state for local updates
  const [messagesState, setMessages] = useState(messages);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;

    if (ws.current) {
      ws.current.close();
    }

    const wsUrl = `ws://192.168.43.234:8000/ws/chat/${currentRoom.name}/`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Date.now(),
            text: data.message,
            user: data.username,
            createdAt: data.created_at,
          },
        ]);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    fetchMessages(currentRoom.id);

    return () => {
      ws.current?.close();
    };
  }, [currentRoom]);

  // Sync messages from context when fetched
  useEffect(() => {
    setMessages(messages);
  }, [messages]);

  const selectRoom = (room: any) => {
    setCurrentRoom(room);
  };

  const handleSend = () => {
    if (!currentRoom || !inputText.trim()) return;
    sendMessage(currentRoom.id, inputText.trim());
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        <ScrollView
          horizontal
          style={styles.roomsList}
          contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 10 }}
          showsHorizontalScrollIndicator={false}
        >
          {rooms.map((room) => {
            const isSelected = currentRoom?.id === room.id;
            return (
              <TouchableOpacity
                key={room.id.toString()}
                style={[styles.roomCard, isSelected && styles.selectedRoomCard]}
                onPress={() => selectRoom(room)}
              >
                <Text style={[styles.roomName, isSelected && styles.selectedRoomName]}>
                  {room.name}
                </Text>
                <Text
                  style={styles.roomDescription}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {room.description || 'No description'}
                </Text>
                <Text style={styles.roomCreatedAt}>
                  Created: {new Date(room.created_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.chatArea}>
          <Text style={styles.title}>
            {currentRoom ? `Room: ${currentRoom.name}` : 'Select a room'}
          </Text>
          {loading && <Text>Loading...</Text>}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}

          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingVertical: 10 }}
            inverted={true} // ScrollView does not support inverted prop, so we reverse manually below
          >
            {[...messagesState].slice().reverse().map((msg) => (
              <View key={msg.id.toString()} style={styles.message}>
                <Text style={styles.messageUser}>{msg.user}</Text>
                <Text>{msg.text}</Text>
                <Text style={styles.messageTime}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {currentRoom && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type message..."
              value={inputText}
              onChangeText={setInputText}
            />
            <Button title="Send" onPress={handleSend} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  roomsList: { height: 110, borderBottomWidth: 1, borderColor: '#ddd', marginBottom: 10 },
  roomCard: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  selectedRoomCard: {
    backgroundColor: '#d0e8ff',
    shadowOpacity: 0.3,
    elevation: 5,
  },
  roomName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'gray',
  },
  selectedRoomName: {
    color: '#1a73e8',
  },
  roomDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  roomCreatedAt: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  chatArea: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 5 },
  messagesContainer: { flex: 1 },
  message: { marginVertical: 4, backgroundColor: '#eee', padding: 8, borderRadius: 5 },
  messageUser: { fontWeight: 'bold' },
  messageTime: { fontSize: 10, color: 'gray', alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
  },
});

export default Community;
