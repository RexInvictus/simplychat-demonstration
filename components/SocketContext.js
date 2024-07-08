import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useUserContext } from "./UserContext";
import { useNavigation, CommonActions } from "@react-navigation/native";
import axios from "axios";
import config from "../config";
import { useMessageContext } from "./MessageContext";
import { registerForPushNotificationsAsync } from "./PushNotifications";
import { useChatContext } from "./ChatContext";
import { updateImageMetadata } from "./MetadataManager";
const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { handleNewMessage } = useMessageContext();
  const navigation = useNavigation();
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, authToken } = useAuth();
  const { userData, updateProfileDataLocally } = useUserContext();
  const { fetchChats, setChatList } = useChatContext();

  useEffect(() => {
    // console.log("is authenticated", isAuthenticated, "authtoken", authToken, "userdata", userData);
    if (isAuthenticated && userData) {
      // console.log("Creating a new socket instance...")
      const newSocket = io(`${config.BASE_URL}`, {
        query: { userId: userData.id }
      });
      setSocket(newSocket);
      // get user data, chat data huhiunkjnjknonji jiji
      const getEverything = async () => {
        // console.log("Geting everything...")
        await fetchChats();
      }
      getEverything();
    } else if (socket) {
      socket.close();
      setSocket(null);
    }
  }, [authToken, isAuthenticated, userData?.id]);
  
  const handleUpdatedOwnPfp = async (data) => {
    await updateProfileDataLocally({'pfp': data.pfp});
    await updateImageMetadata(userData.id, data.pfp, "socket context");
  };

  const handleBanned = (data) => {
    alert('You have been banned for breaching the following rule: ' + data.reason + "\n\n Your ban will expire on " + data.duration);
    
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { name: 'Register' },
        ],
      })
    );
  };

  const handleWarned = async (data) => {
    // console.log("war");
    alert('You have received a warning for: ' + data.reason + '\nIf you do it again you will receive a ban.');
    await axios.post(`${config.BASE_URL}/acknowledge-warning`, {'userId': userData?.id});
  };


  const handleNewMessageUser = async (data) => {
    const newMessage = {
      type: data.type,
      user: data.username,
      timestamp: new Date(),
      content: data.content,
      sender_id: data.sender_id,
    };
    
    // Call the function to add the new message to the mmcontext
    handleNewMessage(data.chat_id, newMessage); // Assuming handleNewMessage is the function you would define in your MessageContext to handle new messages
  }

  useEffect(() => {
    // console.log(socket, !!socket)
    if (socket) {

      socket.on("new_message_user", handleNewMessageUser);
      socket.on('updated_own_pfp', handleUpdatedOwnPfp);
      socket.on('banned', handleBanned);
      socket.on('warned', handleWarned);
  
      socket.on('new_last_message', (data) => {
        
        setChatList((prevChats) => {
          const chatIndex = prevChats.findIndex(chat => chat.chatId === data.chatId);
          
          if (chatIndex === -1) {
            // New chat, add it to the beginning of the list
            return [
              {
                chatId: data.chatId,
                userId: userData.id,
                title: data.title,
                otherId: data.otherId,
                lastMessage: data.lastMessage,
                lastMessageDate: data.lastMessageDate,
                lastMessageType: data.type,
                pfp: data.pfp,
                lastSender: data.senderId,
                unreadMessages: data.unreadMessages,
                online: data.online,
              },
              ...prevChats
            ];
          } else {
            // Existing chat, update the last message and move it to the top
            const updatedChat = {
              ...prevChats[chatIndex],
              lastMessage: data.lastMessage,
              lastMessageDate: data.lastMessageDate,
              lastMessageType: data.type,
              lastSender: data.senderId,
              unreadMessages: data.unreadMessages,
              online: data.online,
            };
  
            const newChats = [...prevChats];
            newChats.splice(chatIndex, 1);
  
            return [updatedChat, ...newChats];
          }
        });
      });
  
      socket.on('user_status_update', (data) => {
        setChatList((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.otherId === data.userId) {
              return {
                ...chat,
                online: data.online,
                lastSeen: data.lastSeen,
                pfp: data.pfp
              };
            } 
            return chat;
          });
        });
      });

      socket.on('message_read_user', (data) => {
        setChatList((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.chatId === data.chatId) {
              return {
                ...chat,
                unreadMessages: 0,
              }
            }
            return chat;
          });
        });
      });


      socket.on('user_typing', (data) => {
        setChatList((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.chatId == data.chatId) {
              return {
                ...chat,
                typing: true
              }
            }
            return chat;
          });
        });
      });

      socket.on('user_stopped_typing', (data) => {
        setChatList((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.chatId === data.chatId) {
              return {
                ...chat,
                typing: false
              }
            }
            return chat;
          });
        });
      });

      socket.on('add_friend_user', (data) => {
        setChatList((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.chatId === data.chatId) {
              return {
                ...chat,
                friends: data.newFriends
              }
            }
            return chat;
          });
        });
      });


      socket.on('unadd_friend_user', (data) => {
        setChatList((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.chatId === data.chatId) {
              return {
                ...chat,
                friends: 0
              }
            }
            return chat;
          })
        })
      })
  

    socket.on('user_blocked', (data) => {
      setChatList((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.chatId === data.chatId) {
            return {
              ...chat,
              blocked: data.blockerId,
              friends: 0,
            }
          }
          return chat;
        })
      })
    });

    socket.on('user_unblocked', (data) => {
      // console.log("unblocking user...")
      setChatList((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.chatId === data.chatId) {
            return {
              ...chat,
              blocked: 0
            }
          }
          return chat;
        })
      })
    });
  }
    return () => {
      if (socket) {
        socket.off('updated_own_pfp', handleUpdatedOwnPfp);
        socket.off('banned', handleBanned);
        socket.off('warned', handleWarned);
        socket.off('new_message_user', handleNewMessageUser);
        socket.off('new_last_message');
        socket.off('user_status_update');
        socket.off('message_read_user');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
        socket.off('add_friend_user');
        socket.off('unadd_friend_user');
        socket.off('user_blocked');
        socket.off('user_unblocked');
      }
    }

  }, [socket]);


  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
