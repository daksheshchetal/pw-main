import React, {useState, useEffect} from 'react';
import{
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch} from 'firebase/firestore';
import {db} from '../../services/firebase/firebaseConfig';
import {useAuth} from '../../context/AuthContext';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants';
export default function NotificationsScreen({navigation}){
    const {currentUser}=useAuth();
    const [loading,setLoading]=useState(true);
    const [notifications, setNotifications]=useState([]);
    const [filter,setFilter]=useState('all');
    useEffect(()=>{
        fetchNotifications();
    },[]);
    const fetchNotifications=()=>{
        const notificationsRef=collection(db, 'notifications');
        const q=query(
            notificationsRef,
            where('userId','==',currentUser.uid),
            orderBy('createdAt','desc')
        );
        const unsubscribe=onSnapshot(q,(snapshot)=> {
    const notifList=[];
    snapshot.forEach((doc)=>{
        notifList.push({id:doc.id, ...doc.data()});
    });
    setNotifications(notifList);
    setLoading(false);
});
return()=>unsubscribe();
    }
    const getFilteredNotifictions=()=>{
        if (filter==="all") return notifications;
        if (filter==='unread') return notifications.filter(n=> !n.read);
        return notifications.filter(n=>n.type===filter);
    };
    const markAsRead=async(notificationId)=>{
        try{
            const notifRef=doc(db,'notifications',notificationId);
            await updateDoc(notifRef,{read:true});
        } catch(error){
            console.error('Error marking as read:',error);
        }
    };
}
