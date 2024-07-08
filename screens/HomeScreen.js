import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfileButton from '../components/ProfileButton';
import ChatItem from '../components/ChatItem';
import FilterPopUp from '../components/FilterPopUp';
import { useAuth } from '../components/AuthContext';
import axios from 'axios';
import { useUserContext } from '../components/UserContext';
import { useSocket } from '../components/SocketContext';
import { Button } from 'react-native-paper';
import { MenuProvider } from 'react-native-popup-menu';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FriendRequestsPopup from '../components/FriendRequests';
import { useChatContext } from '../components/ChatContext';
import config from '../config';
import SettingsButton from '../components/SettingsButton'; 
import { useAds } from '../components/UseAds';


const HomeScreen = ({ navigation }) => {
  const { chatList, friendChats, hiddenChats, visibleChats, requestedChats, fetchChatsPaginated } = useChatContext();
  const { handleSearchClick } = useAds();
  const { userData } = useUserContext();
  const { authToken } = useAuth();
  const createChatUrl = `${config.BASE_URL}/createchat`
  const [filterVisible, setFilterVisible] = useState(false);
  const [requestsVisible, setRequestsVisible] = useState(false);
  const socket = useSocket();

  const [selectedGender, setSelectedGender] = useState('Any');
  const [selectedMinAge, setSelectedMinAge] = useState(18);
  const [selectedMaxAge, setSelectedMaxAge] = useState(100);
  const [isMatchByInterestsEnabled, setIsMatchByInterestsEnabled] = useState(false);  
  const [previouslyMatchedId, setPreviouslyMatchedId] = useState(0);

  const [selectedComponent, setSelectedComponent] = useState('chats');
  const [isSearching, setIsSearching] = useState(false);

  const createChat = async () => {
    try {
      setIsSearching(true);
          const data = {
        'lastSearched': previouslyMatchedId,
        'gender': selectedGender,
        'minAge': selectedMinAge,
        'maxAge': selectedMaxAge,
        'matchByInterests': isMatchByInterestsEnabled,
        'interests': userData.interests
      };

      const response = await axios.post(createChatUrl, data, {
        headers: {
          Authorization: authToken,
        },
      });
      
      const newChatId = response.data.chat_id;
      setPreviouslyMatchedId(response.data.otherId);
      if (response.status === 200) {
        navigation.navigate('Chat', { chatId: newChatId, username:  response.data.username, otherId: response.data.otherId, pfp: response.data.pfp, friends: response.data.friends, online: response.data.online, lastSeen: response.data.lastSeen})
      } else {
        // console.log("UNABLE TO CREATE CHAT. CHECK API.")
      }
      setIsSearching(false);
    } catch (error) {
      // console.log(error)
      setIsSearching(false);
    }

  }

  const toggleFilterPopup = () => {
    setFilterVisible(!filterVisible);
  };

  const toggleRequestsPopup = (bool) => {
    setRequestsVisible(bool);
  }


  const setCount = (chats) => {
    
    const totalUnreadMessages = chats.reduce((acc, chat) => {
      if (chat.lastSender !== userData.id) {
        return acc + (chat.unreadMessages || 0);
      }
      return acc;
    }, 0);   

    if (totalUnreadMessages > 100) {
      return '99+';
    } else {
      return totalUnreadMessages.toString();
    }
}


  const [loading, setLoading] = useState(false);
  

  return (
    <MenuProvider>
      <View style={styles.container}>
        <StatusBar style='auto' />
        <View style={styles.header}>       
          {userData && <ProfileButton />}
          <Text style={styles.caption}>Chats</Text>
          <SettingsButton />
        </View>
        <View style={styles.optionsContainer}>
            <TouchableOpacity onPress={() => {setSelectedComponent('blocked')}} style={[styles.blockedChats, selectedComponent == 'blocked' && styles.selectedStyle]}>
            <Text style={styles.optionText}>Blocked/Hidden</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setSelectedComponent('chats')}} style={[styles.blockedChats, selectedComponent == 'chats' && styles.selectedStyle]}>
            <Text style={styles.optionText}>Chats</Text>
            <View style={styles.countCircle}><Text style={{color: 'white', textAlign: 'center',}}>{setCount(visibleChats)}</Text></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setSelectedComponent('friends')}} style={[styles.blockedChats, selectedComponent == 'friends' && styles.selectedStyle]}>
            <Text style={styles.optionText}>Friends</Text>
            <View style={styles.countCircle}><Text style={{color: 'white', textAlign: 'center',}}>{setCount(friendChats)}</Text></View>
            </TouchableOpacity>

          </View>
                
        <View style={styles.flexContainer}>
        <View style={[styles.chat_list_container, { display: selectedComponent === 'chats' ? 'flex' : 'none' }]}>
            <FlatList
              data={visibleChats}
              onEndReached={async () => {
                if (visibleChats.length >= 5) {
                // console.log("End reached.");
                setLoading(true);
                await fetchChatsPaginated('visible', visibleChats.length);
                setLoading(false);
                }
              }}
              renderItem={({ item }) => <ChatItem chat={item}/>}
              keyExtractor={(item) => item.chatId.toString()}
              contentContainerStyle={{ paddingBottom: 10 }}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={5}
              getItemLayout={(data, index) => (
                {length: 41, offset: 41 * index, index}
              )}
              ListFooterComponent={
                loading ? <ActivityIndicator size="large" color="#00ff00" /> : null
              }
  
            />
          </View>
          <View style={[styles.chat_list_container, { display: selectedComponent === 'blocked' ? 'flex' : 'none' }]}>
            <FlatList
              data={hiddenChats}
              onEndReached={async () => {
                if (hiddenChats.length >= 5) {
                // console.log("End reached.");
                setLoading(true);
                await fetchChatsPaginated('visible', hiddenChats.length);
                setLoading(false);
                }
              }}
              renderItem={({ item }) => <ChatItem chat={item}/>}
              keyExtractor={(item) => item.chatId.toString()}
              contentContainerStyle={{ paddingBottom: 10 }}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={5}
              getItemLayout={(data, index) => (
                {length: 41, offset: 41 * index, index}
              )}
              ListFooterComponent={
                loading ? <ActivityIndicator size="large" color="#00ff00" /> : null
              }
  
            />
          </View>
          <View style={[styles.chat_list_container, { display: selectedComponent === 'friends' ? 'flex' : 'none' }]}>
            <FlatList
              data={friendChats}
              onEndReached={async () => {
                if (friendChats.length >= 5) {
                // console.log("End reached.");
                setLoading(true);
                await fetchChatsPaginated('visible', friendChats.length);
                setLoading(false);
                }
              }}
              renderItem={({ item }) => <ChatItem chat={item}/>}
              keyExtractor={(item) => item.chatId.toString()}
              contentContainerStyle={{ paddingBottom: 10 }}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={5}
              getItemLayout={(data, index) => (
                {length: 41, offset: 41 * index, index}
              )}
              ListFooterComponent={
                loading ? <ActivityIndicator size="large" color="#00ff00" /> : null
              }
  
            />
          </View>
        </View>

        <View style={styles.bottomButtons}>
           <TouchableOpacity style={styles.search_button} onPress={() => {toggleRequestsPopup(true);}}>
              <View style={[styles.friendRequestNumberCircle, requestedChats.length > 0 ? {backgroundColor: 'green'} : {}]}><Text style={{textAlign: 'center', color: 'white'}}>{requestedChats.length}</Text></View>
              <MaterialIcons name="group-add" size={50} color="grey" style={{transform: [{scaleX: -1}]}}/>
              <Text style={{color: 'grey', textAlign: 'center'}}>Requests</Text>

            </TouchableOpacity>
          <TouchableOpacity onPress={toggleFilterPopup} style={styles.filter_button}> 
          <MaterialIcons name="filter-list" size={50} color="grey" />
          <Text style={{color: 'grey', textAlign: 'center'}}>Filter</Text>
          </TouchableOpacity>
          {chatList &&
            <TouchableOpacity style={styles.search_button} onPress={() => {handleSearchClick(); createChat();}}> 
              <MaterialIcons name="person-search" size={50} color="#E4572E" />
              <Text style={{color: 'grey', textAlign: 'center'}}>Search</Text>

            </TouchableOpacity>
          }
           <Modal
        animationType="slide"
        transparent={true}
        visible={isSearching}
        onRequestClose={() => {
          setIsSearching(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Searching...</Text>
            <ActivityIndicator size="40" color="#E4572E" />
          </View>
        </View>
      </Modal>
          <FilterPopUp 
      visible={filterVisible}
      onClose={toggleFilterPopup}
      onGenderChange={setSelectedGender}
      onMinAgeChange={setSelectedMinAge}
      onMaxAgeChange={setSelectedMaxAge}
      onMatchByInterestsChange={setIsMatchByInterestsEnabled} />
      <FriendRequestsPopup 
      visible={requestsVisible}
      onClose={toggleRequestsPopup}
      chats={requestedChats}
      refresh={() => {}}
      />
        </View>
      </View>
    </MenuProvider>
  );
  }
  const styles = StyleSheet.create({
    countCircle: {
      marginTop: 3,
      marginLeft: 10,
      backgroundColor: '#E4572E',
      borderRadius: 50,
      width: 30,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
    },


    friendRequestNumberCircle: {
      borderWidth: 0.1,
      borderColor: 'grey',
      backgroundColor: 'transparent',
      height: 20,
      width: 20,
      borderRadius: 50,
      position: 'absolute',
      marginTop: 10,
      marginLeft: -5,
      zIndex: 2, 
      justifyContent: 'center',
      alignItems: 'center'
    },
    optionText: {
      color: 'white',
    },
    selectedStyle: {
      borderColor: '#E4572E',
    },

    blockedChats: {
      flex: 1,
      borderBottomWidth: 2,
      borderColor: 'grey',
      paddingVertical: 10,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    optionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },

    container: {
      flex: 1,
      backgroundColor: '#4C4C4C',
    },
    header: {
      marginTop: 20,
      paddingHorizontal: 20,
      height: '10%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly'

    },
    caption: {
      color: 'white',
      opacity: 0.5,
      fontWeight: 'bold',
      fontSize: 25,
      textAlign: 'center',
      flex: 1,
      marginRight: 50,
    },
    flexContainer: {
      flex: 1,
    },
    chat_list_container: {
      flex: 1,
    },
    hiddenChatContainer: {
      backgroundColor: 'black'
    },
    hiddenChatText: {
      textAlign: 'center',
      color: 'white',
      fontSize: 20,
    },
    bottomButtons: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      height: 100,
      backgroundColor: '#393939'
    },
    filter_button: {
      marginTop: 10,
      height: 60,
      borderRadius: 50,
    },
    search_button: {
      marginTop: 10,
      height: 60,
      borderRadius: 50,
    },
    button_text: {
      color: 'white',
      textAlign: 'center',
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    modalView: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 50,
      paddingHorizontal: 100,
      alignItems: 'center',
    },
    modalText: {
      textAlign: 'center',
      marginTop: -20,
      marginBottom: 30,
      fontWeight: 'bold',
      fontSize: 20,
    },
  });
  

  export default React.memo(HomeScreen);
  