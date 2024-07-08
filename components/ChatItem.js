import React, {useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useChatContext } from './ChatContext';
import CachedImage from './CachedImage';
import { useUserContext } from './UserContext';
import config from '../config';
import { useAds } from './UseAds';


const ChatItem = ({ chat }) => {
  const { userData} = useUserContext();
  const { setChatList } = useChatContext();
  const socket = useSocket();
  const {authToken} = useAuth();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const imageSource = chat.pfp;
  const { handleChatClick } = useAds();
  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    setRefresh(true);
  }, [imageSource])
  
  const userLastSender = chat.lastSender === chat.userId;
  const unreadMessages = chat.unreadMessages;
  const lastMessageType = chat.lastMessageType;

  const lastMessageDateFull = useMemo(() => {
    const lastMessageDate = new Date(chat.lastMessageDate);
    const lastMessageHours = lastMessageDate.getHours().toString().padStart(2, '0');
    const lastMessageMinutes = lastMessageDate.getMinutes().toString().padStart(2, '0');
    return `${lastMessageHours}:${lastMessageMinutes}`;
  }, [chat.lastMessageDate]);

  const online = chat.online;
  const typing = chat.typing;
  const friends = chat.friends;

  const chatHidden = (chat.hidden === chat.userId || chat.hidden === -1);
  const chatBlockedMe = chat.blocked === chat.otherId;



    const handleChatPress = () => {
      handleChatClick();
      if (chatHidden) {
          unhideChat();
        }

        if (!menuVisible) {
            navigation.navigate('Chat', {
                chatId: chat.chatId,
                username: chat.title,
                otherId: chat.otherId,
                pfp: chat.pfp,
                userLastSender,
                unreadMessages,
                online,
                lastSeen: chat.lastSeen,
                friends: chat.friends,
                forceUpdate: chat.forceUpdate,
                iBlockedChat: chat.blocked === chat.userId,
                chatBlockedMe: chat.blocked === chat.otherId
            });
        }
    };


    const blockUser = async () => {
      if (socket) {
      socket.emit('block', {
        chat_id: chat.chatId,
        user_id: chat.userId,
        other_id: chat.otherId
      })
      setChatList((prevChats) => {
        return prevChats.map((chat_) => {
          if (chat.chatId === chat_.chatId) {
            return {
              ...chat_,
              hidden: userData.id, // hide chat if blocked 
              friends: 0, // unadd friends if friends
              blocked: userData.id, // block the user
            };
          }
          return chat_;
        })
      });
      } else {
        alert('It appears you are disconnected. Please check your internet connection.')
      }
    }


    const hideChat = async () => {
      try {
        const response = await axios.post(`${config.BASE_URL}/hide`, {blocked: false, chatId: chat.chatId}, {
          headers: {
            Authorization: authToken
          }
        });
        if (response.status === 200) {
          // // console.log("Successfully hidden chat")
          setChatList((prevChats) => {
            return prevChats.map((chat_) => {
              if (chat.chatId === chat_.chatId) {
                return {
                  ...chat_,
                  hidden: userData.id, // hide chat if blocked 
                  friends: 0, // unadd friends if friends
                };
              }
              return chat_;
            })
          }); 
               }
      } catch (error) {
        // console.error(error)
      }
    };

    const unhideChat = async () => {
      try {
        const response = await axios.post(`${config.BASE_URL}/unhide`, {chatId: chat.chatId, otherId: chat.otherId}, {
          headers: {
            Authorization: authToken
          }
        })
        if (response.status === 200) {
          // // console.log("Successfully unhidden chat")
          setChatList((prevChats) => {
            return prevChats.map((chat_) => {
              if (chat.chatId === chat_.chatId) {
                return {
                  ...chat_,
                  hidden: 0, // hide chat if blocked 
                };
              }
              return chat_;
            })
          }); 
        }
      } catch (error) {
        // console.error(error)
      }
    };

    const unaddFriend = async () => {
      if (socket) {
      socket.emit('unadd_friend', {chat_id: chat.chatId, user_id: chat.userId, other_id: chat.otherId});
      setChatList((prevChats) => {
        return prevChats.map((chat_) => {
          if (chat.chatId === chat_.chatId) {
            return {
              ...chat_,
              friends: 0,
            };
          }
          return chat_;
        })
      });
    }
    }

    
    return (
      <Menu opened={menuVisible} onBackdropPress={() => setMenuVisible(false)}>
        <MenuTrigger customStyles={{ triggerTouchable: { onLongPress: () => setMenuVisible(true), onPress: handleChatPress } }}>
          <View style={styles.chatItem}>
          <View style={styles.infoView}>
          <View style={styles.time}><Text style={styles.timeText}>{lastMessageDateFull}</Text></View>

            { !userLastSender && unreadMessages !== 0 &&
            <View style={styles.unreadDisplay}>
              <Text style={styles.unreadText}>{unreadMessages}</Text>
            </View>
            }
            
            </View>
              <View style={styles.profileCircle}>
              {/* <CachedImage
                    key={imageSource}
                    source={{ uri: imageSource }}
                    cacheKey={"user" + chat.otherId}
                    style={styles.profile_image}
                    forceUpdate={refresh}
                    userId={chat.otherId}
                    isOwnProfile={false}
                /> */}
                <Image 
                  source={{uri: imageSource}}
                  style={styles.profile_image}
                />
              </View>
            
            
            <View style={styles.nameContainer}>
            <View style={styles.circles}>
            <Text style={styles.chatTitle}>{chat.title}</Text>
            { online &&
            <View style={styles.online}></View>
            }
            </View>

            <View style={styles.lastMessageContainer}>
            { userLastSender && !chatBlockedMe &&
            (unreadMessages ? 
            (<MaterialIcons name="check" size={24} color={'grey'} marginRight={10}/>):
            (<MaterialIcons name="done-all" size={24} color={'green'} marginRight={10}/>))
          }
          

            { typing ? (
              <Text style={styles.typing}>Typing...</Text>
            ) : lastMessageType === 'text' ? (
              <Text style={styles.lastMessage}>{chat.lastMessage}</Text>
            ) : lastMessageType === 'image' ? (
              <Text style={styles.lastMessage}>{userLastSender ? 'You' : chat.title} sent an image.</Text>
            ) : <Text style={styles.lastMessage}>{userLastSender ? 'You' : chat.title} sent a voice message.</Text>}
            </View>
          
            </View>
            
          </View>
    </MenuTrigger>
    <MenuOptions>
      { !chatBlockedMe &&
      <MenuOption onSelect={() => { alert('Block User'); setMenuVisible(false); blockUser();}} text='Block User' />
      }
      <MenuOption onSelect={() => { alert('Delete Chat'); setMenuVisible(false); hideChat(); }} text='Delete Chat' />
      { friends === -1 &&
      <MenuOption onSelect={() => { alert('Unadd Friend'); setMenuVisible(false); unaddFriend(); }} text='Unadd Friend' />
      }
      { chatHidden &&
      <MenuOption onSelect={() => { alert('Unhide Chat'); setMenuVisible(false); unhideChat(); }} text='Unhide Chat' />
      }

    </MenuOptions>
    </Menu>
    
  );
};

const styles = StyleSheet.create({
  unblockButton: {
    color: '#FFB800', 
    marginTop: 5,
  },

  blockedMessage: {
    color: '#FF1B1C',
    marginTop: 5,
    width: '100%',
  },

  typing: {
    marginTop: 5,
    color: '#04F06A90',
  },

  lastMessageContainer: {
    flexDirection: 'row',
  },

  circles: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'yellow',
  },

  online: {
    backgroundColor: '#04F06A',
    height: 10,
    width: 10,
    marginLeft: 5,
    borderRadius: 10,
    marginTop: 4,
  },

  infoView: {
    position: 'absolute',
    right: 20,
    bottom: 0,
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  time: {
    margin: 5,
  },
  timeText: {
    color: '#ffffff90',
  },
  unreadDisplay: {
    backgroundColor: '#E4572E',
    height: 25,
    width: 25,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  unreadText: {
    color: '#ffff',
    fontSize: 15,
  },

  profileCircle: {
    
    backgroundColor: 'blue',
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: 'lightblue',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
        
  },
  chatItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: 'gray',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  lastMessage: {
    color: '#ffffff90',
    marginTop: 5,
    width: '100%',
  },
  nameContainer: {
    marginLeft: 25,
    flexDirection: 'column',
  },
  profile_image: {
    width: 50,
    height: 50,
    borderRadius: 35,
    overflow: 'hidden',
},
});

export default React.memo(ChatItem);
