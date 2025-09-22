import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AI } from '@anivar/mobile-ai-toolkit';

// Initialize AI on app start
AI.configure({
  preferOnDevice: true,
  enablePrivateMode: false,
  cacheEnabled: true,
});

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzeText = async () => {
    if (!input.trim()) {
      Alert.alert('Error', 'Please enter some text');
      return;
    }

    setLoading(true);
    try {
      const analysis = await AI.analyze(input);
      setResult(`
Sentiment: ${analysis.sentiment > 0 ? '😊 Positive' : analysis.sentiment < 0 ? '😔 Negative' : '😐 Neutral'}
Score: ${analysis.sentiment.toFixed(2)}
Language: ${analysis.language}
Processing: ${analysis.wasOnDevice ? '📱 On-device (FREE)' : '☁️ Cloud'}
      `.trim());
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const generateSmartReply = async () => {
    setLoading(true);
    try {
      const replies = await AI.smartReply(input);
      setResult('Smart Replies:\n' + replies.map((r, i) => `${i + 1}. ${r}`).join('\n'));
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const chatWithAI = async () => {
    setLoading(true);
    try {
      const response = await AI.chat(input);
      setResult(`AI Response:\n${response.message}\n\n${response.fromDevice ? '📱 Processed on-device' : '☁️ Processed in cloud'}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const checkCapabilities = async () => {
    try {
      await AI.initialize();
      const caps = AI.getCapabilities();
      setResult(`Device Capabilities:
✅ On-device AI: ${caps.hasOnDeviceAI ? 'Yes' : 'No'}
✅ Models: ${caps.models?.join(', ') || 'None'}
✅ Text Analysis: ${caps.features?.textAnalysis ? 'Yes' : 'No'}
✅ Vision: ${caps.features?.vision ? 'Yes' : 'No'}
✅ Speech: ${caps.features?.speech ? 'Yes' : 'No'}
      `.trim());
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>Mobile AI Toolkit Demo</Text>
          <Text style={styles.subtitle}>On-device AI • Zero Cloud Costs</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Enter text to analyze..."
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={analyzeText}
            disabled={loading}>
            <Text style={styles.buttonText}>Analyze Sentiment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={generateSmartReply}
            disabled={loading}>
            <Text style={styles.buttonText}>Smart Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={chatWithAI}
            disabled={loading}>
            <Text style={styles.buttonText}>Chat with AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={checkCapabilities}
            disabled={loading}>
            <Text style={styles.buttonText}>Check Capabilities</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {result !== '' && !loading && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Result:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Most features run on-device for FREE!
          </Text>
          <Text style={styles.footerText}>
            🔒 Your data stays private on your device
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
  },
  infoButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  resultContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
});