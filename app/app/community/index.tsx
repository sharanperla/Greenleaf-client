import { useChat } from '@/contexts/ChatContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CommunityListScreen() {
  const { rooms, fetchRooms, createRoom } = useChat();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    await createRoom(newRoomName.trim());
    setNewRoomName('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {rooms.map((room) => (
          <TouchableOpacity
            key={room.id}
            style={styles.roomCard}
            onPress={() => router.push({
  pathname: "/app/community/[room]",
  params: { room: room.name },
})}
          >
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomDescription}>{room.description || 'No description'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Room name"
              value={newRoomName}
              onChangeText={setNewRoomName}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Create" onPress={handleCreateRoom} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold' },
  addButton: { fontSize: 28, color: '#007bff' },
  roomCard: { padding: 12, backgroundColor: '#eee', borderRadius: 8, marginBottom: 10 },
  roomName: { fontWeight: 'bold', fontSize: 16 },
  roomDescription: { fontSize: 14, color: '#555' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 8 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
});
