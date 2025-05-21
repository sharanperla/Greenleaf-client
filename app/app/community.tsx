import { useChat } from '@/contexts/ChatContext';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
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
  const scrollViewRef = useRef<ScrollView>(null);

  const [messagesState, setMessages] = useState(messages);
  const yourUserId = 2; // Replace this with logged-in user ID dynamically

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;

    if (ws.current) ws.current.close();

    const wsUrl = `ws://192.168.43.234:8000/ws/chat/${currentRoom.name}/`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id || Date.now(),
            content: data.message,
            user: {
              id: data.user_id,
              username: data.username,
            },
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
        <Text style={styles.title}>Rooms</Text>
        <ScrollView style={styles.roomsList}>
          {rooms.map((room) => {
            const isSelected = currentRoom?.id === room.id;
            return (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCard, isSelected && styles.selectedRoomCard]}
                onPress={() => selectRoom(room)}
              >
                <Text style={[styles.roomName, isSelected && styles.selectedRoomName]}>
                  {room.name}
                </Text>
                <Text style={styles.roomDescription} numberOfLines={2}>
                  {room.description || 'No description'}
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
            ref={scrollViewRef}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messagesState.map((msg) => {
              const isOwnMessage = msg.user?.id === yourUserId;
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage,
                  ]}
                >
                  {!isOwnMessage && (
                    <Text style={styles.messageUser}>{msg.user?.username}</Text>
                  )}
                  <Text style={styles.messageText}>{msg.content}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              );
            })}
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
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 5 },
  roomsList: {
    maxHeight: 150,
    marginBottom: 10,
  },
  roomCard: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedRoomCard: {
    backgroundColor: '#d0e8ff',
  },
  roomName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'gray',
  },
  selectedRoomName: {
    color: '#1a73e8',
  },
  roomDescription: {
    fontSize: 14,
    color: '#555',
  },
  chatArea: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 10,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 10,
  },
  message: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#dcf8c6',
    borderTopRightRadius: 0,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
  },
  messageUser: {
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 12,
    color: '#555',
  },
  messageTime: {
    fontSize: 10,
    color: 'gray',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
  },
});

export default Community;
