import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions
} from 'react-native';
import * as Location from 'expo-location';
import MapScreen from '../../screens/customer/MapScreen';
import { useAuth } from '../../context/AuthContext';
import { db, auth } from '../../services/firebase/firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
import MenuCard from '../../components/customer/MenuCard';

const menuRef = collection(db, 'menu_items');

const UserScreen = () => {
  const { logOut } = useAuth();
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  const setHomeLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Permission denied');
      
      let location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        },
        locationTimestamp: new Date().toISOString()
      });
      
      Alert.alert('Success', 'Home location set for Geofencing!');
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Failed to save location. Check console.');
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      menuRef,
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setMenuItems(items);
      },
      (error) => {
        console.error('Error fetching menu items:', error);
        Alert.alert('Error', 'Could not load the menu.');
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hungry?</Text>
          <Text style={styles.title}>Browse Menu</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.locBtn} onPress={setHomeLocation}>
        <Text style={styles.locText}>📍 Set my Home Location</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mapToggleButton}
        onPress={() => setShowMiniMap(!showMiniMap)}
      >
        <Text style={styles.buttonText}>
          {showMiniMap ? 'Close Map' : 'View Nearby Vendors'}
        </Text>
      </TouchableOpacity>

      {showMiniMap && (
        <View style={styles.mapWrapper}>
          <MapScreen />
        </View>
      )}

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id} // FIXED: Typo corrected from "ird" to "id"
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }) => (
          <MenuCard item={item} isVendor={false} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              The chef is currently preparing the menu...
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  locBtn: {
    backgroundColor: '#007bff',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
  },
  locText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  welcomeText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
  },
  logoutText: {
    color: '#555',
    fontWeight: '600',
  },
  listPadding: {
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  mapToggleButton: {
    backgroundColor: '#007bff',
    padding: 12,
    marginHorizontal: 20, // FIXED: Typo corrected from "marginHoriztonal"
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  mapWrapper: {
    height: 300,
    width: Dimensions.get('window').width - 40,
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
});

export default UserScreen;