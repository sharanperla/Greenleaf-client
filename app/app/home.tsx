import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { Camera, Send } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';  // new import

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  image?: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Ask for permissions and pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission denied", "We need permission to access your photos to upload an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      base64: true,  // important for sending image data
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      // Optionally you can add this image as a message right away or wait for send
    }
  };

  // Call API for prediction - replace with your own API URL and token
  const callPredictionAPI = async (imageUri: string) => {
    try {
      const formData = new FormData();

      // Convert local file URI to something FormData can use
      // React Native expects { uri, name, type }
      formData.append('image', {
        uri: imageUri,
        name: 'plant.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch('http://127.0.0.1:8000/api/data/predict/', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ1MzE0NzA3LCJpYXQiOjE3NDUyMjgzMDcsImp0aSI6IjIxMTJhZGVmOWFjOTRlN2RhOGI4NWQ0NzY1MWMyNmExIiwidXNlcl9pZCI6NH0.BtX4JTXiA9nxpwEbrwz9KIwwjS4trRO9oe_5Csl6e3I',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const json = await response.json();
      return json;
    } catch (error) {
      Alert.alert("Error", "Failed to get prediction from server.");
      return null;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return; // Nothing to send

    // Add user's message first (text or image)
    const newMessages: Message[] = [];

    if (selectedImage) {
      newMessages.push({
        id: Date.now().toString(),
        text: inputText || 'Image sent',
        isUser: true,
        image: selectedImage,
      });
    } else {
      newMessages.push({
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
      });
    }

    setMessages([...messages, ...newMessages]);
    setInputText('');
    setSelectedImage(null);

    // Call prediction API if image sent
    if (selectedImage) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Analyzing your image, please wait...",
        isUser: false,
      }]);

      const prediction = await callPredictionAPI(selectedImage);

      if (prediction) {
        setMessages(prev => [...prev.slice(0, -1), {
          id: (Date.now() + 2).toString(),
          text: JSON.stringify(prediction, null, 2), // You can format better
          isUser: false,
        }]);
      } else {
        setMessages(prev => [...prev.slice(0, -1), {
          id: (Date.now() + 2).toString(),
          text: "Sorry, could not analyze the image.",
          isUser: false,
        }]);
      }
    } else {
      // If only text, simple response (mock)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "I'll analyze your query and provide a detailed response shortly.",
        isUser: false,
      }]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatContainer}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}>
            {message.image && (
              <Image source={{ uri: message.image }} style={styles.messageImage} />
            )}
            <Text
              style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText,
              ]}>
              {message.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
          <Camera size={24} color="#2E7D32" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Send size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: '#F7FAF7',
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2E7D32',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#333333',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    maxHeight: 100,
  },
  cameraButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#2E7D32',
    padding: 8,
    borderRadius: 20,
  },
});
