import React, {createContext, useContext, useState, useEffect} from "react";
import { requestChats } from "./RequestChats";
import { useAuth } from "./AuthContext";
import { useUserContext } from "./UserContext";

const ChatContext = createContext();

export const ChatProvider = ( { children } ) => {
    const { userData } = useUserContext(); 
    const { authToken } = useAuth(); 
    const [chatList, setChatList] = useState([]);
    const [friendChats, setFriendChats] = useState([]);
    const [visibleChats, setVisibleChats] = useState([]);
    const [hiddenChats, setHiddenChats] = useState([]);
    const [requestedChats, setRequestedChats] = useState([]);


    // useEffect(() => {
    //   // Create an array of 100 test chats
    //   const newChats = Array.from({ length: 100 }, (_, i) => ({
    //     chatId: i,
    //     userId: `${i}`,
    //     title: `Chat ${i}`,
    //     otherId: `user${i}`,
    //     lastMessage: `Last message ${i}`,
    //     lastMessageDate: new Date().toISOString(),
    //     lastMessageType: "test",
    //     pfp: "https://d1zmmxvc41334f.cloudfront.net/pfp.png",
    //     lastSender: "user1",
    //     unreadMessages: 0,
    //     online: false,
    //     lastSeen: new Date().toISOString(),
    //     blocked: 0,
    //     hidden: 0,
    //     friends: 0,
    //     forceUpdate: true,
    //   }));
    
    //   setChatList(newChats)
    // }, []);

    
    // initial chat fetch
    const fetchChats = async () => {
        try {
          if (authToken) {
            // setChatList([]);
            await fetchChatsPaginated('visible', 0);
            await fetchChatsPaginated('friends', 0);
            await fetchChatsPaginated('blocked', 0);
        } 
      } catch (error) {
          // console.log(error);
        }
      };

      const fetchChatsPaginated = async (category, offset) => {
        try {
          if (authToken) {
            const newChats = await requestChats(authToken, category, offset);
            if (newChats) {
              setChatList(prevChatList => {
                // Combine old and new chats
                const combinedChats = [...prevChatList, ...newChats];
                // Remove duplicates based on chatId
                const uniqueChats = Array.from(new Map(combinedChats.map(chat => [chat.chatId, chat])).values());
                return uniqueChats;
              });
            }
          }
        } catch (error) {
          // console.error(error);
        }
      };
      

      const falsifyForceUpdate = (chatId) => {
        setChatList((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.chatId === chatId) {
              return {
                ...chat,
                forceUpdate: false,
              };
            } 
            return chat;
          });
        });
      }

      useEffect(() => {
        // differentiating the chats whenever the chatlist changes
        const differentiateChats = (chatList) => {

          // if the hider isn't user and both haven't hidden and not blocked, it's visible
          const visibleChats = chatList.filter(chat => chat.hidden !== userData.id && chat.hidden !== -1 && chat.friends !== -1); //&& chat.friend === false
          // if the hider is user or both have hidden it's hidden
          const hiddenChats = chatList.filter(chat => chat.hidden === userData.id || chat.hidden === -1);
          //find friendchats
          const friendChats = chatList.filter(chat => chat.hidden !== userData.id && chat.hidden !== -1 && chat.friends === -1);
          
          // find friend requests...
          const requestedChats = chatList.filter(chat => chat.hidden !== userData.id && chat.hidden !== -1 && chat.friends === chat.otherId);
    
          // set the chatlist to the visible ones
          setVisibleChats(visibleChats);
          // set the hiddenchats to the invisible ones, which we will render in a dropdown display
          setHiddenChats(hiddenChats);
          // set friend chats
          setFriendChats(friendChats);
          // set requested chats
          setRequestedChats(requestedChats);

          
        }
        if (userData) {
        differentiateChats(chatList);
        }
      }, [chatList])

    return (
        <ChatContext.Provider value={{ chatList, friendChats, visibleChats, requestedChats, hiddenChats, setChatList, fetchChats, falsifyForceUpdate, fetchChatsPaginated }}>
            { children }
        </ChatContext.Provider>
    )
}


export const useChatContext = () => {
    return useContext(ChatContext);
};