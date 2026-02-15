import React from 'react';
import{View,Text,StyleSheet,TouchableOpacity,SafeAreaView,Platform} from 'react-native';
const WelcomeScreen=({navigation})=>{
    return(
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.logo}>📍Paaswala</Text>
                <Text style={styles.tagline}>Aapki Apni Local Market</Text>
                <View style={styles.buttonWrapper}>
                    <TouchableOpacity
                    style={styles.mainButton}
                    onPress={()=>navigation.navigate("LanguageSelection")}
                    >
                        <Text style={styles.buttonText}>Get Started/शुरू करें</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#fff' }, content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, logo: { fontSize: 42, fontWeight: 'bold', color: '#007AFF', marginBottom: 10 }, tagline: { fontSize: 18, color: '#555', marginBottom: 50 }, mainButton: { backgroundColor: '#007AFF', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 30, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, }, buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }); 
export default WelcomeScreen;