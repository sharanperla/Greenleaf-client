import { useChat } from '@/contexts/ChatContext';
import { API_BASE_URL } from '@/utils/config';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
const getFullImageUri = (path: string) =>
  path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

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
    createRoom,
    setCurrentRoom,
  } = useChat();

  const { user } = useAuth();
  const yourUserId = user?.id;  

  const [inputText, setInputText] = useState('');
  const [messagesState, setMessages] = useState(messages);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);


  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;
    ws.current?.close();
    ws.current = new WebSocket(
      `ws://192.168.43.234:8000/ws/chat/${currentRoom.name}/`
    );
    ws.current.onmessage = e => {
      const data = JSON.parse(e.data);
      if (data.type === 'chat_message') {
        setMessages(prev => [
          ...prev,
          {
            id: data.id || Date.now(),
            content: data.message,
            image: data.image_url
              ? getFullImageUri(data.image_url)
              : null,
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

  const selectRoom = (room: any) => setCurrentRoom(room);

  const handleSendText = () => {
    if (!currentRoom || !inputText.trim()) return;
    sendMessage(currentRoom.id, inputText.trim());
    setInputText('');
  };

  const handlePickImage = async () => {
    if (!currentRoom) return;
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Camera roll permissions are needed to send images.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const mime = asset.type === 'image' ? 'image/jpeg' : asset.type;
    await sendImageMessage(currentRoom.id, asset.uri, mime);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      Alert.alert('Please enter a room name');
      return;
    }
    await createRoom(newRoomName.trim());
    setNewRoomName('');
    setModalVisible(false);
  };

  return (
    <>
      {/* Create Room Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Room</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter room name"
              value={newRoomName}
              onChangeText={setNewRoomName}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Create" onPress={handleCreateRoom} />
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.container}>
          {/* Rooms header with + button */}
          <View style={styles.roomsHeader}>
            <Text style={styles.title}>Rooms</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>＋</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.roomsList}>
            {rooms.map(room => {
              const sel = currentRoom?.id === room.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    styles.roomCard,
                    sel && styles.selectedRoomCard,
                  ]}
                  onPress={() => selectRoom(room)}
                >
                  <Text
                    style={[
                      styles.roomName,
                      sel && styles.selectedRoomName,
                    ]}
                  >
                    {room.name}
                  </Text>
                  <Text
                    style={styles.roomDescription}
                    numberOfLines={2}
                  >
                    {room.description || 'No description'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.chatArea}>
            <Text style={styles.title}>
              {currentRoom
                ? `Room: ${currentRoom.name}`
                : 'Select a room'}
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
              {messagesState.map(msg => {
                const isOwn = msg.user.id === yourUserId;
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.message,
                      isOwn
                        ? styles.ownMessage
                        : styles.otherMessage,
                    ]}
                  >
                    {!isOwn && (
                      <Text style={styles.messageUser}>
                        {msg.user.username}
                      </Text>
                    )}
                    {msg.image ? (
                      <Image
                        source={{ uri: msg.image }}
                        style={styles.imageMessage}
                      />
                    ) : (
                      <Text style={styles.messageText}>
                        {msg.content}
                      </Text>
                    )}
                    <Text style={styles.messageTime}>
                      {new Date(
                        msg.created_at
                      ).toLocaleTimeString()}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {currentRoom && (
            <View style={styles.inputContainer}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.imageButton}
              >
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
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  roomsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: { flex: 1, fontWeight: 'bold', fontSize: 20 },
  addButton: { paddingHorizontal: 12, paddingVertical: 4 },
  addButtonText: { fontSize: 24, lineHeight: 24 },

  roomsList: { maxHeight: 150, marginBottom: 10 },
  roomCard: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedRoomCard: { backgroundColor: '#d0e8ff' },
  roomName: { fontWeight: 'bold', fontSize: 16, color: 'gray' },
  selectedRoomName: { color: '#1a73e8' },
  roomDescription: { fontSize: 14, color: '#555' },

  chatArea: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 10,
  },
  messagesContainer: { flex: 1, marginBottom: 10 },
  message: {
    maxWidth: '70%',
    padding: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  ownMessage: {
    marginLeft: 'auto',
    backgroundColor: '#dcf8c6',
    borderTopRightRadius: 0,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e5ea',
    borderTopLeftRadius: 0,
  },
  messageUser: { fontWeight: 'bold', marginBottom: 2 },
  messageText: { fontSize: 16 },
  imageMessage: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageTime: { fontSize: 10, color: '#666', marginTop: 2 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  imageButton: { padding: 6, marginRight: 8 },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 8,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default Community;
