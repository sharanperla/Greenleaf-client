import { usePrediction } from '@/contexts/PredictionProvider';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Send } from 'lucide-react-native';
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";

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
  const { predict } = usePrediction();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission denied", "We need permission to access your photos to upload an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const callPredictionAPI = async (imageUri: string) => {
    try {
      const result = await predict(imageUri);
      console.log('this is the result of prediction', result);
      return result;
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to get prediction from server.");
      return null;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

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

    if (selectedImage) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Analyzing your image, please wait...",
        isUser: false,
      }]);

      const prediction = await callPredictionAPI(selectedImage);

      if (prediction) {
        const { disease, confidence, other_predictions } = prediction;

        const resultText = `🔍 Most Likely Disease: **${disease}**\nConfidence: ${confidence.toFixed(2)}%\n\n📌 Other Possibilities:\n` +
          other_predictions.map(p => `• ${p.disease} (${p.confidence.toFixed(2)}%)`).join('\n');

        setMessages(prev => [...prev.slice(0, -1), {
          id: (Date.now() + 2).toString(),
          text: resultText,
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
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        )}
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
  previewImage: {
    width: 100,
    height: 100,
    margin: 8,
    borderRadius: 8,
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
