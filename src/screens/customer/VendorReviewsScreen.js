import React, {useState, useEffect} from 'react';
import {
    View, 
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import {collection, query, where, orderBy, onSnapshot} from 'firebase/firestore';
import {db} from '../../services/firebase/firebaseConfig';
import {COLORS, FONTS, SPACING, RADIUS} from '../../constants';
export default function VendorReviewsScreen({route, navigation}){
    const {vendorId, vendorName}= route.params;
    const[reviews, setReviews]= useState([]);
    const [loading, setLoading]=useState(true);
    useEffect(()=>{
        const reviewsRef=collection(db, 'reviews');
        const q=query(
            reviewsRef,
            where('vendorId','==',vendorId),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe=onSnapshot(
            q,
            (snapshot)=> {
                const reviewsList=[];
                snapshot.forEach((doc)=>{
                    reviewsList.push({id:doc.id,...doc.data()});
                });
                setReviews(reviewsList);
                setLoading(false);
            },
            (error)=>{
                console.error('Error fetching reviews:',error);
                setLoading(false);
            }
        );
        return()=>unsubscribe();
    },[vendorId]);
    const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };
  const renderReview= ({item})=>(
    <View style={styles.reviewCard}>
        <View styles={styles.reviewHeader}>
            <View style={styles.avatar}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.customerName?.[0]?.toUpperCase()||'?'}
                    </Text>
                </View>
                <View style={styles.reviewHeaderInfo}>
                    <Text style={styles.customerName}>
                        {item.customerName || 'Anonymous'}
                    </Text>
                    <Text style={styles.stars}>{renderStars(item.rating)}</Text>
                </View>
                <Text style={styles.date}>
                {item.createdAt?.toDate().toLocaleDateString()||'Recent'}
                </Text>
            </View>
            <Text style={styles.reviewText}>{item.reviewText}</Text>
        </View>
    </View>
  );
}