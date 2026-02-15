import React,{useState,useEffect} from 'react';
import{
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Button,
    Switch
} from 'react-native';
import * as Location from 'expo-location';
import {useAuth} from '../../context/AuthContext';
import{db,auth} from '../../services/firebase/firebaseConfig';
import {
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import MenuCard from'../components/MenuCard';
const menuRef=collection(db,'menu_items');
const initialItemState={
    id:null,
    name:"",
    description:"",
    price:"",
    imageURL:"",
    isVeg: false,
    nutrition:{
        calories:"",
        protein:""
    }

}
const VendorScreen=()=>{
    const {logOut}=useAuth();
    const[menuItems,setMenuItems]=useState([]);
    const[modalVisible,setModalVisible]=useState(false);
    const[newItem,setNewItem]=useState(initialItemState);
    const[isLive,setIsLive]=useState(false);
    //Go Live and Geofencing Location Update
    const toggleLiveStatus=async(value)=>{
        if(value){
            let{status}=await Location.requestForegroundPermissionsAsync();
                if(status !=='granted'){
                    Alert.alert("Permission Denied","Location is needed to show you on the Mohalla Map");
                    return;
                } try{
                    let loc=await Location.getCurrentPositionAsync({});
                        const vendorRef=doc(db,'users',auth.currentUser.uid);
                        await updateDoc(vendorRef,{
                            location:{
                                latitude:loc.coords.latitude,
                                longitude:loc.coords.longitude,
                            },
                            isOnline:true,
                            lastActive:new Date()
                        });
                        setIsLive(true);
                            Alert.alert("Success","Your stall is now visible to customers nearby!");
                }
                catch(err){
                    console.error(err);
                    Alert.alert("Error","Could not update location.")
                }
        }
        else{
            const vendorRef=doc(db,'users',auth.currentUser.uid);
            await updateDoc(vendorRef,{isOnline:false});
            setIsLive(false);
        }
    }
    //Read from db
    useEffect(()=>{
        const unsubscribe=onSnapshot(menuRef,(snapshot)=>{
            const items=[];
            snapshot.forEach(doc=>{
                items.push({id:doc.id,...doc.data()});
            })
            setMenuItems(items);
        },(error)=>{
            console.error("Error fetching menu items:",error)
            Alert.alert("Error","Could not fetch menu items")
        }
    )
    return()=>unsubscribe();
    },[])
    //create or update the menu
    const handleSaveItem=async()=>{
        if(!newItem.name || !newItem.price){
            Alert.alert("Missing Fields","Please enter item name and price.");
            return;
        }
        const itemToSave={
            name:newItem.name,
            description:newItem.description,
            price:parseFloat(newItem.price),
            imageURL:newItem.imageURL||'',
            isVeg:newItem.isVeg,
            nutrition:{
                calories:newItem.nutrition.calories?
                parseInt(newItem.nutrition.calories):0,
                protein:newItem.nutrition.protein?
                parseFloat(newItem.nutrition.protein):0,
            }
        }
        try{
            if(newItem.id){
                //UPDATE(U)
                const docRef=doc(db,'menu_items',newItem.id)
                await updateDoc(docRef,itemToSave);
                Alert.alert("Success",`${newItem.name} updated!`)
            }
            else{
                //CREATE(C)
                await addDoc(menuRef,itemToSave);
                Alert.alert("Success",`${newItem.name}created!`)
            }
            //Reset form and close modal
                setNewItem(initialItemState);
                setModalVisible(false);
        }
        catch(error){
            Alert.alert("Error","Failed to save item:"+error.message);
            console.error(error);
        }
    }
    const handleDelete=(id)=>{
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this menu item?",
            [
                {text:"Cancel",style:"cancel"},
                {text:"Delete",
                    style:"destructive",
                    onPress:async()=>{
                        try{
                            await deleteDoc(doc(db,'menu_items',id));
                            Alert.alert("Success","Item Deleted!")
                        }
                        catch(error){
                            Alert.alert("Error","Failed to delete item.");
                            console.error(error);
                        }
                    }
                }
            ]
        )
    }
    //Prepare items edit using a form
    const handleEditPress=(item)=>{
        const itemToEdit={
            ...item,
            price:item.price.toString(),
            nutrition:{
                calories:item.nutrition?.calories?.toString()||"",
                protein:item.nutrition?.protein?.toString()||"",
            }
        }
        setNewItem(itemToEdit);
        setModalVisible(true);
    }
    //Prepare to add new items in the form
    const handleAddPress=()=>{
        setNewItem(initialItemState);
        setModalVisible(true);
    }
    return(
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Vendor Menu Manager</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={logOut}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.statusCard}>
                <Text style={styles.statusLabel}>
                    {isLive ?"Your shop is LIVE":"Your shop is CLOSED"}
                </Text>
                <Switch
                    value={isLive}
                    onValueChange={toggleLiveStatus}
                    trackColor={{false:'#767577',true:'#81b0ff'}}
                    thumbColor={isLive ? "#28a745":'#f4f3f4'}
                />
            </View>
            <FlatList
            data={menuItems}
            keyExtractor={(item)=>item.id}
            renderItem={({item})=>(
                <MenuCard
                    item={item}
                    isVendor={true}
                    onEdit={handleEditPress}
                    onDelete={handleDelete}/>
            )}
            ListEmptyComponent={
                <Text style={styles.emptyText}>
                    No menu items found. Add one!
                </Text>
            }/>
            <TouchableOpacity
            style={styles.addButton}
                onPress={handleAddPress}>
                    <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={()=>
                setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>
                            {newItem.id?'Edit Item':'Add New Item'}
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Item Name"
                            value={newItem.name}
                            onChangeText={(text)=>
                                setNewItem({...newItem,name:text})
                            }/>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Price(₹)"
                                value={newItem.price.toString()}
                                onChangeText={(text)=>
                                    setNewItem({...newItem,price:text})
                                }
                                keyboardType="numeric"/>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Description(Optional)"
                                valye={newItem.description}
                                onChangeText={(text)=>
                                    setNewItem({...newItem,description:text})
                                }
                                multiline={true}/>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Image URL(Public Link)"
                                value={newItem.imageURL}
                                onChangeText={(text)=>setNewItem({...newItem,imageURL:text})}/>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Vegetarian Item</Text>
                            <Switch 
                                trackColor={{false:"#E53935",true:"#4CAF50"}}
                                thumbColor={"#f4f3f4"}
                                onValueChange={(value)=>setNewItem({...newItem,isVeg:value})}
                                value={newItem.isVeg}/>
                            </View>
                            <Text style={styles.subHeading}>Nutritional Info(Optional)</Text>
                            <View style={styles.rowContainer}>
                                <TextInput
                                    style={[styles.textInput,styles.halfInput]}
                                    placeholder="Calroies"
                                    value={newItem.nutrition.calories}
                                    onChangeText={(text)=>
                                        setNewItem({...newItem,nutrition:{...newItem.nutrition,calories:text}})}
                                        keyboardType="numeric"/>
                                <TextInput
                                    style={[styles.textInput,styles.halfInput]}
                                    placeholder="Protein(g)"
                                    value={newItem.nutrition.protein}
                                    onChangeText={(text)=>
                                        setNewItem({...newItem,nutrition:{...newItem.nutrition,protein:text}})}
                                    keyboardType="numeric"/>
                                    
                            </View>
                            <View style={styles.modalButtonContainer}>
                                <Button title="Cancel"
                                onPress={()=>
                                    setModalVisible(false)}
                                color="#6c757d"/>
                                <Button
                                title={newItem.id?
                                "Update":"Create"}
                                onPress={handleSaveItem}/>  
                            </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}
const styles=StyleSheet.create({
    container:{
    flex:1,
    paddingTop:50,
    backgroundColor:'#f5f5f5',
},
statusCard:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    backgroundColor:'#fff',
    padding:15,
    borderRadius:12,
    marginBottom:20,
    elevation:2
},
statusLabel:{fontSize:16,fontWeight:'600'
},
    header:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingHorizontal:16,
        marginBottom:10,
},
title:{
    fontSize:22,
    fontWeight:'bold',
},
logoutButton:{
    padding:8,
    backgroundColor:'#dc3545',
    borderRadius:5,
},
logoutText:{
    color:'#fff',
    fontWeight:'bold',
},
emptyText:{
    textAlign:'center',
    marginTop:50,
    fontSize:16,
    color:'#888'
},
addButton:{
    position:'absolute',
    bottom:30,
    right:30,
    backgroundColor:'#007AFF',
    width:60,
    height:60,
    borderRadius:30,
    justifyContent:'center',
    alignItems:'center',
    shadowColor:'#000',
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.3,
    shadowRadius:5,
    elevation:8,
},
addButtonText:{
    color:'white',
    fontSize:30,
    lineHeight:30,
},
centeredView:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'rgba(0,0,0,0.5)',
},
modalView:{
    margin:20,
    backgroundColor:'white',
    borderRadius:20,
    padding:35,
    alignItems:35,
    shadowColor:'#000',
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.25,
    shadowRadius:4,
    elevation:5,
    width:'90%',
},
modalTitle:{
    fontSize:20,
    fontWeight:'bold',
    marginBottom:20,
},
textInput:{
    width:'100%',
    padding:10,
    marginVertical:5,
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:8,
},
modalButtonContainer:{
    flexDirection:'row',
    justifyContent:'space-around',
    width:'100%',
    marginTop:20,
},
subHeading:{
    fontSize:14,
    fontWeight:'600',
    color:'#333',
    alignSelf:'flex-start',
    marginTop:10,
    marginBottom:5,
},
rowContainer:{
    flexDirection:'row',
    justifyContent:'space-between',
    width:'100%',
    marginBottom:5,
},
halfInput:{
    width:'48%',
},
switchRow:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    width:'100%',
    paddingVertical:10,
    paddingHorizontal:5,
    borderWidth:1,
    borderColor:'#eee',
    borderRadius:8,
    marginVertical:10,
},
switchLabel:{
    fontSize:16,
    color:'#333',
},
})
export default VendorScreen;