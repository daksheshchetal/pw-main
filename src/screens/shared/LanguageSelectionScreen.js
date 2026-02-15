import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // FIXED: Typo corrected

const LanguageSelectionScreen = ({ navigation }) => {
  const selectLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('userLanguage', lang);
      navigation.navigate('Auth'); // FIXED: Navigate to Auth instead of Login
    } catch (e) {
      console.error('Failed to save language', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your language</Text>
      <Text style={styles.subtitle}>अपनी भाषा चुनिए</Text>
      
      <TouchableOpacity style={styles.langCard} onPress={() => selectLanguage('en')}>
        <Text style={styles.langEmoji}>🇬🇧</Text>
        <Text style={styles.langName}>English</Text>
      </TouchableOpacity>

      <TouchableOpacity // FIXED: Typo corrected from ToucableOpacity
        style={styles.langCard}
        onPress={() => selectLanguage('hi')}
      >
        <Text style={styles.langEmoji}>🇮🇳</Text>
        <Text style={styles.langName}>हिन्दी (Hindi)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  langEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  langName: {
    fontSize: 18,
    fontWeight: '500',
  },
});

export default LanguageSelectionScreen;