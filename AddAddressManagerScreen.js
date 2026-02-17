import React, {useState,useEffect,useRef} from 'react';
import{
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import MapView,{Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import {doc,updateDoc,getDoc,arrayUnion} from 'firebase/firestore';
import {db} from '../../context/AuthContext';
import {COLORS,FONTS,SPACING,RADIUS} from '../../constants';
import { useStateForPath } from '@react-navigation/native';
const ADDRESS_TYPES=[
    {id:'home',label:'Home',emoji:'🏠'},
    {id:'work',label:'Work',emoji:'💼'},
    {id:'other',label:'Other',emoji:'📍'},
]
export default function AddAddressScreen({route,navigation}){
    const {currentUser}=useAuth();
    const existingAddress=route.params?.address||null;
    const onSave=route.params?.onSave;
    const isEditing=!!existingAddress;
    const [addressType,setAddressType]=useState(existingAddress?.type||'home');
    const[line1,setLine1]=useState(existingAddress?.line1||'');
    const[line2,setLine2]=useState(existingAddress?.line2||'');
    const [landmark,setLandmark]=useState(existingAddress?.landmark||'');
    const [city,setCity]=useState(existingAddress?.city||'');
    const[state,setState]=useState(existingAddress?.state||'');
    const[pincode,setPincode]=useState(existingAddress?.pincode||'');
    const[location,setLocation]=useState(
        existingAddress?.location||{latitude:28.6139,longitude:77.2090}
    )
    const[saving,setSaving]=useState(false);
    const[locating,setLocating]=useState(false);
    const[showMap,setShowMap]=useState(false);
    const mapRef=useRef(null);
    const handleGetCurrentLocation=async()=>{
        setLocating(true);
        try{
            const{status}=await Location.requestForegroundPermissionsAsync();
            if (status!=='granted'){
                Alert.alert('Permission Denied','Please allow location access to use this feature.');
                setLocating(false);
                return;
            }
            const loc=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
            const {latitude,longitude}=loc.coords;
            setLocation({latitude,longitude});
            const geocode=await Location.reverseGeocodeAsync({latitude,longitude});
            if (geocode.length>0){
                const place=geocode[0];
                if(!line1) setLine1(place.street||place.name||'');
                if(!city) setCity(place.city||place.district||'');
                if(!state) setState(place.region||'');
                if(!pincode) setPincode(place.postalCode||'');
            }
            setShowMap(true);
            setLocating(false);
            mapRef.current?.animateToRegion({
                latitude,
                longitude,
                latitudeDelta:0.002,
                longitudeDelta:0.002,
            });
        }
        catch(error){
            console.error('Location error:',error);
            Alert.alert('Error','Could not get your location. Please enter manually.');
            setLocating(false);
        }
    }
    const handleMapPress=(e)=>{
        setLocation(e.nativeEvent.coordinate);
    };
    const validate=()=>{
        if (!line1.trim()){
            Alert.alert('Required','Please enter your street address:');
            return false;
        }
        if (!city.trim()){
            Alert.alert('Required','Please enter your city.');
            return false;
        }
        if (!state.trim()){
            Alert.alert('Required','Please enter your state.')
            return false;
        }
        if (!pincode.trim()||pincode.length!==6){
            Alert.alert('Invalid','Please enter a valid 6-digit passcode.');
            return false;
        }
        return true;
    }
    const handleSave=async()=>{
        if (!validate()) return;
        setSaving(true);
        try{
            const userRef=doc(db,'users',currentUser.uid);
            const userDoc=await getDoc(userRef);
            const userData=userDoc.data();
            const currentAddresses=userData?.addresses||[];
            const addressData={
                id:existingAddress?.id||`addr_${Date.now()}`,
                type:addressType,
                line1:line1.trim(),
                line2:line2.trim(),
                landmark:landmark.trim(),
                city:city.trim(),
                state:state.trim(),
                pincode:pincode.trim(),
                location,
                createdAt:existingAddress?.createdAt||new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            let updatedAddresses;
            if(isEditing){
                //Replace existing address
                updatedAddresses=currentAddresses.map((a)=>
                a.id===existingAddress.id?addressData:a
            );
            } else {
                //Add new address
                updatedAddresses=[...currentAddresses,addressData];
            }
            const updateData={addresses:updatedAddresses};
            if(currentAddresses.length===0){
                updateData.defaultAddressId=addressData.id;
            }
            await updateDoc(userRef,updateData);
            if (onSave) onSave();
            Alert.alert(
                'Saved!',
                isEditing?'Address updated successfully.':'New address saved!',
                [{text:'OK',onPress:()=>navigation.goBack()}]
            );
        }
        catch(error){
            console.error('Error saving address:',error);
            Alert.alert('Error','Could not save address. Please try again.');
        } finally{
            setSaving(false);
        }
    }
    return(
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={()=>navigation.goBack()}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing?'Edit Address':'Add New Address'}
                </Text>
                <View style={styles.placeholder}/>
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS==='ios'?'padding':undefined}
                style={{flex:1}}
            >
                <ScrollView style={styles.scrollView}keyboardShouldPersistTaps="handled">
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}> Address Type </Text>
                        <View style={styles.typeRow}>
                            {ADDRESS_TYPES.map((type)=>(
                                <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeButton,
                                    addressType===type.id && styles.typeButtonActive,
                                ]}
                                onPress={()=>setAddressType(type.id)}
                                >
                                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                                    <Text
                                    style={[
                                        styles.typeLabel,
                                        addressType===type.id && styles.typeLabelActive,
                                    ]}
                                    >
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
