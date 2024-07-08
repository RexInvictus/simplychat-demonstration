import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, AppState, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { useUserContext } from "../components/UserContext";
import { useSocket } from "../components/SocketContext";
import SmallerProfilePicture from "../components/SmallerProfilePic";
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";
import AudioButton from '../components/AudioButton'
import AudioPlayer from "../components/AudioPlayer";
import CachedImage from "../components/CachedImage";
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import config from "../config";
import { useMessageContext } from "../components/MessageContext";
import { useChatContext } from "../components/ChatContext";
import { useFocusEffect } from "@react-navigation/native";


const ChatScreen = ( { route } ) => {
    const socket = useSocket();
    const { messages, fetchMessages } = useMessageContext();
    const { userData } = useUserContext();
    const { falsifyForceUpdate } = useChatContext();
    

    const [iBlockedChat, setIBlockedChat] = useState(route.params.iBlockedChat);
    const [chatBlockedMe, setChatBlockedMe] = useState(route.params.chatBlockedMe);
    const chatId = route.params.chatId;
    const interlocuterUsername = route.params.username;
    const otherId = route.params.otherId;
    const forceUpdate = route.params.forceUpdate;
    const [pfp, setPfp] = useState(route.params.pfp);

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener('focus', () => {
          // Run code to join room when screen gains focus
          if (socket) {
            socket.emit("join_room", {room: chatId});
          }
        });
      
        const unsubscribeBlur = navigation.addListener('blur', () => {
          // Run code to leave room when screen loses focus
          if (socket) {
            socket.emit('leave_room', { room: chatId });
          }
        });
      
        return () => {
          unsubscribeFocus();
          unsubscribeBlur();
        };
      }, [socket, chatId, navigation]);
      
    
    
    const [online, setOnline] = useState(route.params.online);
    const [lastSeen, setLastSeen] = useState(route.params.lastSeen);
    const [lastSeenMessage, setLastSeenMessage] = useState('');
    

    const [appState, setAppState] = useState(AppState.currentState);
    
    const [chatFriends, setChatFriends] = useState(route.params.friends);

    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (
                appState.match(/inactive|background/) && nextAppState === 'active'
            ) {
                // Do something when the app comes to the foreground
            } else {
                // console.log("leaving room")
                handleStoppedTyping();
            }
        };
    
        // Subscribe to the app state change event
        const subscription = AppState.addEventListener("change", handleAppStateChange);
    
        return () => {
            // Unsubscribe from the app state change event when the component is unmounted
            subscription.remove();
        };
    }, [appState, handleStoppedTyping]);
    

    
    useEffect(() => {
        const updateLastSeenMessage = () => {
            const lastSeenDate = new Date(lastSeen);
            const currentDate = new Date();
            const differenceInMilliseconds = currentDate - lastSeenDate;
            const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
    
            if (differenceInSeconds < 60) {
                // Less than a minute
                setLastSeenMessage('last seen less than a minute ago');
            } else if (differenceInSeconds < 3600) {
                // Less than an hour
                const differenceInMinutes = Math.floor(differenceInSeconds / 60);
                setLastSeenMessage(`last seen ${differenceInMinutes} minute${differenceInMinutes > 1 ? 's' : ''} ago`);
            } else if (differenceInSeconds < 86400) {
                // Less than a day
                const differenceInHours = Math.floor(differenceInSeconds / 3600);
                setLastSeenMessage(`last seen ${differenceInHours} hour${differenceInHours > 1 ? 's' : ''} ago`);
            } else {
                // More than a day
                const differenceInDays = Math.floor(differenceInSeconds / 86400);
                setLastSeenMessage(`last seen ${differenceInDays} day${differenceInDays > 1 ? 's' : ''} ago`);
            }
        };
    
        updateLastSeenMessage();
    
        const intervalId = setInterval(updateLastSeenMessage, 60000); // Update every minute
    
        return () => {
            clearInterval(intervalId); // Clear the interval when the component is unmounted
        };
    }, [lastSeen]);
    

    const [isTyping, setIsTyping] = useState(false);
    const [audioButtonPressed, setAudioButtonPressed] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleUserTyping = (data) => {
            if (data.userId !== userData.id) {
                setIsTyping(true);
            }
        };

        const handleUserStoppedTyping = (data) => {
            if (data.userId !== userData.id) {
                setIsTyping(false);
            }
        };

        const handleBlocked = () => {
            setChatBlockedMe(true);
        }

        socket.on('user_typing', handleUserTyping);
        socket.on('user_stopped_typing', handleUserStoppedTyping);
        socket.on('user_blocked_chat', handleBlocked);
        socket.on('add_friend_chat', (data) => {
            setChatFriends(data.newFriends);
        });
        socket.on('unadd_friend_chat', () => {
            setChatFriends(0);
        });

        return () => {
            socket.off('user_typing', handleUserTyping);
            socket.off('user_stopped_typing', handleUserStoppedTyping);
            socket.off('user_blocked_chat', handleBlocked);
            socket.off('unadd_friend_chat');
            socket.off('add_friend_chat');

        }

    }, [socket])

    const userLastSender = route.params.userLastSender;
    const unreadMessages = route.params.unreadMessages;
    const [localUserLastSender, setLocalUserLastSender] = useState(userLastSender);
    const [localUnreadMessages, setLocalUnreadMessages] = useState(unreadMessages);
    const [messagesRead, setMessagesRead] = useState(userLastSender && !unreadMessages);
    const [loading, setLoading] = useState(false); // initialise loading to false
    
    const navigation = useNavigation();
    const go_back = () => {
        navigation.goBack();
    };
    
    const [messageList, setMessageList] = useState([]);
    const [new_message, set_new_message] = useState("");
    const [messageType, setMessageType] = useState('text');
    const [messageUri, setMessageUri] = useState('');


   
useFocusEffect(
    React.useCallback(() => {
      const onScreenFocus = () => {
          if (!localUserLastSender && localUnreadMessages && socket) {
            // console.log("READING MESSAGE....")
          socket.emit('message_read', { chat_id: chatId, other_id: otherId, userId: userData.id });
        }
      };
  
      onScreenFocus();
  
      return () => {
        // Optional: clean up logic when the screen is unfocused
      };
    }, [messageList, localUserLastSender, localUnreadMessages, socket])
  );   

    const [loadingNewMessages, setLoadingNewMessages] = useState(true);

    // loading cached messages
    useEffect(() => {
        if (messages[chatId]) {
            setMessageList(messages[chatId]);
        }
    }, [messages, chatId]);

    // retrieve further messages from server if forceupdate is true
    useEffect(() => {
        const fetchData = async () => {
          if (forceUpdate) {
            const mergedMessages = await fetchMessages(chatId);
            falsifyForceUpdate(chatId);
            setMessageList(mergedMessages);
        }
        setLoadingNewMessages(false);
        };
    
        fetchData();
        
        return () => {
          handleStoppedTyping();
        };
      }, []);

    const handleSendImageAudio = async (type, uri) => {
        setMessageList((previous) => [...previous, {type: type, user: userData.username, timestamp: new Date(), content: uri, sender_id: userData.id}])
        setLocalUserLastSender(false);
        setMessageType('text');
        setMessageUri('');
        setLoading(true); // when the user initially sends the image, set loading to true since it hasn't been delivered yet

        let content = '';
        if (type === 'image') {
            content = await uploadImage(uri);
        } else if (type === 'audio') {
            // console.log("Confirmed: we are sending audio.")
            content = await uploadAudio(uri);
        }

        if (content.trim() !== "" && socket) {
            socket.emit("send_message", {
              type: type,
              chat_id: chatId,
              username: userData.username,
              sender_id: userData.id,
              content: content,
              timestamp: new Date(),
              pfp: userData.pfp
            });
        }
    };

    const handleSend = async () => {
        if (new_message.trim() !== "" && socket) {
          socket.emit("send_message", {
            type: messageType,
            chat_id: chatId,
            username: userData.username,
            sender_id: userData.id,
            content: new_message,
            timestamp: new Date(),
            pfp: userData.pfp
          });
        
          setMessageList((previous) => [...previous, {type: messageType, user: userData.username, timestamp: new Date(), content: new_message, sender_id: userData.id}])
          set_new_message("");
          setLocalUserLastSender(true);
          setLoading(true);
          setMessageType('text');
          setMessageUri('');
        }
      };

      useEffect(() => {
        if (!socket) return;
    
        const handleNewMessage = (data) => {
            const newMessage = {
                id: data.id,
                type: data.type,
                user: data.username,
                timestamp: new Date(),
                content: data.content,
                sender_id: data.sender_id
            };
    
            if (!(data.sender_id === userData.id)) {
                setLocalUserLastSender(false);
                setLocalUnreadMessages(1);
                setMessageList(previous => [...previous, newMessage]);
            } else {
                setLocalUserLastSender(true);
                setLocalUnreadMessages(0);
                setMessagesRead(false);
                setLoading(false); // when the messsage arrives, set loading to false 
            }
        };
    
        const handleMessageRead = () => {
            setMessagesRead(true);
        };

        const handleUserUpdate = (data) => {
            setOnline(data.online);
            setLastSeen(data.last_seen);
            setPfp(data.pfp);
        }

        socket.on('user_status_update_chat', handleUserUpdate);
        socket.on("new_message", handleNewMessage);
        socket.on('message_read_chat', handleMessageRead);

        return () => {
            socket.off("new_message", handleNewMessage);
            socket.off('message_read_chat', handleMessageRead);
            socket.off('user_status_update_chat', handleUserUpdate);

        };
    }, [socket]);
    
    
    const viewImage = (imageUri, senderId, isOwnMessage, timestamp) => {
        const id = formatDate(timestamp, 2);
        navigation.navigate('Image', {imageUri, senderId, id, isOwnMessage})
    };


    const formatDate = (dateString, purpose) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        const date = new Date(dateString);
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
      
        let suffix = 'th';
        if (day === 1 || day === 21 || day === 31) {
          suffix = 'st';
        } else if (day === 2 || day === 22) {
          suffix = 'nd';
        } else if (day === 3 || day === 23) {
          suffix = 'rd';
        }
        if (purpose === 1) {
        return `${dayName}, ${day}${suffix} ${month}, ${hours}:${minutes}`;
        } else {
        return `${dayName}${day}${suffix}${hours}${minutes}${seconds}`
        }
      };
      
      

    const renderMessage = ({ item }) => {
        const isOwnMessage = item.sender_id === userData.id;
        const senderUsername = isOwnMessage ? userData.username : interlocuterUsername;
        const messageStyle = isOwnMessage ? styles.ownMessage : styles.otherMessage;
    
        return (
            <View style={messageStyle.container}>
                <Text style={messageStyle.username}>{senderUsername}</Text>
                <Text style={messageStyle.timestamp}>{formatDate(item.timestamp, 1)}</Text>
    
                {item.type === 'text' && (
                    <Text style={messageStyle.content}>{item.content}</Text>
                )}
    
                {item.type === 'image' && (
                    <TouchableOpacity
                    onPress={() => {
                        viewImage(item.content, item.sender_id, isOwnMessage, item.timestamp);
                    }}>
                    {item.content.startsWith('http') ?
                    <CachedImage
                    key={item.content}
                        cacheKey={item.sender_id + "id" + formatDate(item.timestamp, 2)}
                        source={{ uri: item.content }}
                        style={{ width: 200, height: 200 }}
                        message={true}
                        userLastSender={isOwnMessage}
                    />
                    :
                    <Image 
                    source={{uri: item.content}}
                    style={{ width: 200, height: 200 }}
                    />
                }
                </TouchableOpacity>
                )}

                {item.type === 'audio' && (
                    <AudioPlayer uri={item.content}/>
                )
                }
            </View>
        );
    };
    
    const handleTyping = () => {
        if (socket) {
            socket.emit('user_typing', { chat_id: chatId, user_id: userData.id, other_id: otherId })
        }
    }

    const handleStoppedTyping = () => {
        if (socket) {
            socket.emit('user_stopped_typing', { chat_id: chatId, user_id: userData.id, other_id: otherId })
        }
    }

    const addFriend = () => {
        if (socket) {
            socket.emit('add_friend', { chat_id: chatId, user_id: userData.id, other_id: otherId })
        }
    }

    const rejectFriendRequest = () => {
        if (socket) {
            socket.emit('unadd_friend', { chat_id: chatId, user_id: userData.id, other_id: otherId });
        }
    }

    const handlePicturePress =  async () => {
        // console.log("Pressed pic", chatFriends, userData.id )
        if (chatFriends === 0 || chatFriends === userData.id || chatFriends === undefined) {
            alert("Sorry! You can only send images to friends. Please send a friend request first!");
            return;
        }
    
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to send images!');
            return;
        }
    
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,  // Corrected this line
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1
        });
    
        if (!result.canceled) {
            if (result.assets && result.assets.length > 0) {
                const compressedImage = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{resize: {width: 500}}],
                    {compress: 0.7, format: ImageManipulator.SaveFormat.JPEG}
                )

                const fileInfo = await FileSystem.getInfoAsync(compressedImage.uri);
                const fileSize = fileInfo.size;
                if (fileSize > 5 * 1024 * 1024) {
                    alert('This file is too large. Please select a different file.')
                    return;
                }

                const uri = compressedImage.uri;
                setMessageUri(uri);
                setMessageType('image');
            }
        }
    };

    const uploadImage = async (uri) => {
        try {
          const formData = new FormData();
          formData.append('image', {
            uri: uri,
            name: uri.split('/').pop(),
            type: `image/${uri.split('.').pop()}` 
          });
          const uploadResponse = await axios.post(`${config.BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
          });
          if (uploadResponse.status === 200) {
            return uploadResponse.data.url;
          }
        } catch (error) {
        //   console.log(error);
        }
      };

    const uploadAudio = async (uri) => {
        try {
            const formData = new FormData();
            formData.append('fileType', 'audio');
            formData.append('audio', {
                uri: uri,
                name: uri.split('/').pop(),
                type: `audio/${uri.split('.').pop()}`
            });

            const uploadResponse = await axios.post(`${config.BASE_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
              });
            if (uploadResponse.status === 200) {
                return uploadResponse.data.url;
              };

        } catch (error) {
            // console.error("Error uploading audio: ", error);
        }
    };



    const unblockUser = () => {
        if (socket) {
        socket.emit('unblock', {
          chat_id: chatId,
          user_id: userData.id,
          other_id: otherId
        })
        setIBlockedChat(false);
        }
      }

  

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={go_back} style={styles.temp}>
                    <Ionicons name="chevron-back-outline" size={30} color="#3F7CAC" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { chatmateId: otherId })}>
                    <SmallerProfilePicture imageSource={pfp} userId={otherId}/>
                </TouchableOpacity>
                <View style={styles.infoContainer}>
                    <Text style={styles.caption}>{interlocuterUsername}</Text>
                    {online ? 
                        (<Text style={styles.online}>Online</Text>)
                        : (<Text style={styles.lastSeen}>{lastSeenMessage}</Text>)}
                </View>
                {chatFriends !== -1 && chatFriends !== userData.id ? (
                    <View style={styles.addContainer}>
                        <TouchableOpacity onPress={() => {
                            if (messageList.length !== 0) {
                                addFriend();
                            } else {
                                alert("Get to know the person first before adding friend!")
                            }
                        }}>
                            <MaterialIcons name="person-add" size={40} color="#5BBA6F" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    chatFriends === -1 ? (
                        <View style={styles.addContainer}>
                            <TouchableOpacity>
                                <MaterialIcons name="favorite" size={40} color="#5BBA6F" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.addContainer}>
                            <TouchableOpacity>
                                <MaterialIcons name="favorite-border" size={40} color="#5BBA6F" />
                            </TouchableOpacity>
                        </View>
                    )
                )}
            </View>
            { chatFriends === otherId &&
            <View style={styles.addedMeContainer}>
                <Text style={{marginLeft: -20}}>{interlocuterUsername} added you as a friend!</Text>
                <TouchableOpacity style={styles.acceptRejectButtons} onPress={addFriend}><Text>Accept</Text></TouchableOpacity>
                <TouchableOpacity style={styles.acceptRejectButtons} onPress={rejectFriendRequest}><Text>Reject</Text></TouchableOpacity>
            </View>}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    {loadingNewMessages ? <ActivityIndicator size="large" color="#0000ff" /> : null}
                    <FlatList
                        style={{ flex: 1 }}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        data={[...messageList].reverse()}
                        inverted={true}
                        renderItem={renderMessage}
                        keyExtractor={(item, index) => index.toString()}
                    />
                    <View style={styles.seenContainer}>
                        <View style={{flex: 1}}>
                            { isTyping &&
                                <Text style={styles.typingText}>Typing...</Text>
                            }
                        </View>
                        {loading && <ActivityIndicator size='small' color='grey' style={{marginRight: 10}}/> }
                        {localUserLastSender && !loading && (
                            messagesRead ? 
                                (<MaterialIcons name="done-all" size={24} color={'green'} marginRight={10}/>)
                                : 
                                (<MaterialIcons name="check" size={24} color={'grey'} marginRight={10}/>)
                        )}
                    </View>
                    { messageType === 'image' &&
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            source={{ uri: messageUri }}
                            style={{ width: 100, height: 100, borderRadius: 25 }}
                        />
                        <TouchableOpacity onPress={() => { setMessageUri(''); setMessageType('text'); }}>
                            <Text>Remove</Text>
                        </TouchableOpacity>
                    </View>}

                    {iBlockedChat ? (
                    <View style={styles.blockContainer}>
                        <Text>You have blocked this chat.</Text>
                        <TouchableOpacity onPress={unblockUser} style={styles.unblock}>
                            <Text style={{color: '#FFB800'}}>Unblock</Text>
                        </TouchableOpacity>
                     </View>
                    ) : chatBlockedMe ? (
                   <View style={styles.blockContainer}>
                     <Text>{interlocuterUsername} blocked you.</Text>
                       </View>
                      ) : (
                    <View style={styles.inputContainer}>
                        { 
                            !audioButtonPressed && 
                            <>
                                <TouchableOpacity onPress={handlePicturePress}>
                                    <MaterialIcons name="add" size={40} color="#77ACA2" style={{marginRight: 10}}/>
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.input, messageType === 'image' && styles.invisible]}
                                    placeholder="Type your message..."
                                    value={new_message}
                                    onChangeText={text => set_new_message(text)}
                                    onFocus={handleTyping}
                                    onBlur={handleStoppedTyping}
                                />
                                <TouchableOpacity onPress={() => {
                                    if (messageType === 'text') {
                                        handleSend();
                                    } else if (messageType === 'image') {
                                        handleSendImageAudio(messageType, messageUri);
                                    }
                                }} style={styles.sendButton}>
                                    <Text>Send</Text>
                                </TouchableOpacity>
                            </>
                        }
                        <AudioButton sendAudio={handleSendImageAudio} setAudioButtonPressed={setAudioButtonPressed}/>
                    </View> 
                )}
                </KeyboardAvoidingView>
        </View>
    );
    
    
};

const styles = StyleSheet.create({
    unblock: {
        padding: 10,
        opacity: 0.7,
    },
    blockContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: 10,
    },

    invisible: {
        opacity: 0,
        pointerEvents: 'none',
    },

    acceptRejectButtons: {
        
    },
    addedMeContainer: {
        backgroundColor: 'yellow',
        padding: 5,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    addContainer: {
        position: 'absolute',
        right: 0,
        marginRight: 10,
    },
    typingText: {
        marginLeft: 10,
        color: '#ffffff60'
    },
 
    seenContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 5,
    },

    caption: {
        color: 'white',
        fontSize: 25,
        
    },

    online: { 
        color: '#04F06A50',
    },

    lastSeen: {
        color: 'rgba(255, 255, 255, 0.4)'
    },

    temp: {
        position: 'absolute',
        left: 0,
    },

    tempText: {
        color: 'blue',
        fontSize: 20,
        marginLeft: 10,
    },

    container: {
        flex: 1,
        backgroundColor: '#4C4C4C',
    },
    header: {
        marginTop: 20,
        paddingHorizontal: 20,
        height: '10%',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomColor: 'grey',
        borderBottomWidth: 2,
    },
    messageContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: 'gray',
    },
    messageUsername: {
        
    },
    inputContainer: {
        backgroundColor: '#0F110840',
        justifyContent: 'center',
        height: 40,
        flexDirection: 'row',
        alignItems: 'center', // Align children vertically in the center
        paddingHorizontal: 10, // Add some padding to the left and right
    },
    input: {
        flex: 4, // Take up 80% of the available space
        height: '80%',
        backgroundColor: 'grey',
        padding: 10,
        borderRadius: 20,
    },
    sendButton: {
        flex: 1, // Take up 20% of the available space
        marginLeft: 20,
        marginRight: 10,
    },

    ownMessage: {
        container: {
            backgroundColor: '#4CAF50',
            borderRadius: 20,
            padding: 10,
            marginBottom: 5,
            alignSelf: 'flex-end',
            maxWidth: '70%',
        },
        username: {
            color: 'white',
            fontSize: 12,
            marginBottom: 5,
        },
        timestamp: {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 10,
        },
        content: {
            color: 'white',
        },
    },
    otherMessage: {
        container: {
            backgroundColor: '#F0F0F0',
            borderRadius: 20,
            padding: 10,
            marginBottom: 5,
            alignSelf: 'flex-start',
            maxWidth: '70%',
        },
        username: {
            color: 'black',
            fontSize: 12,
            marginBottom: 5,
        },
        timestamp: {
            color: 'rgba(0, 0, 0, 0.7)',
            fontSize: 10,
        },
        content: {
            color: 'black',
        },
    },
});

export default ChatScreen;
