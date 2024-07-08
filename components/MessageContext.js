import React, { createContext, useContext, useEffect, useState } from "react";
import { requestMessages } from "./RequestMessages";
import { useAuth } from "./AuthContext";
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('SimpleChatDatabase.db');
const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { authToken } = useAuth();
  const [messages, setMessages] = useState({});

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY NOT NULL, chatId TEXT, messageData TEXT);"
      );
    });

    // db.transaction(tx => {
    //   tx.executeSql("DROP TABLE IF EXISTS messages;", [], (_, result) => {
    //     console.log("Messages table dropped:", result);
    //   },
    //   (_, error) => {
    //     console.log("SQLite Error:", error);
    //   });
    // });
    
  }, []);



  const fetchMessages = async (chatId) => {
    if (authToken && chatId) {
      try {
        let mostRecentMessage = null;
        let cachedMessages = [];
  
        // Fetch cached messages from SQLite
        await new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              "SELECT messageData FROM messages WHERE chatId = ? ORDER BY id DESC LIMIT 1;",
              [chatId],
              (_, { rows }) => {
                if (rows.length > 0) {
                  cachedMessages = JSON.parse(rows.item(0).messageData);
                  if (Array.isArray(cachedMessages) && cachedMessages.length > 0) {
                    mostRecentMessage = cachedMessages[cachedMessages.length - 1];
                  }
                }
                resolve();
              },
              (_, error) => {
                console.error("SQLite Error:", error);
                reject(error);
              }
            );
          });
        });
  
        // Fetch newer messages from the server
        let messagesArray = [];
        if (mostRecentMessage) {
          messagesArray = await requestMessages(authToken, chatId, mostRecentMessage.timestamp);
        } else {
          messagesArray = await requestMessages(authToken, chatId);
        }
  
        // Deduplicate using Set and map
        const messageIds = new Set(cachedMessages.map(msg => msg.id));
        const uniqueNewMessages = messagesArray.filter(msg => !messageIds.has(msg.id));
  
        // Merge with cached messages and update SQLite cache
        let mergedMessages = [...cachedMessages, ...uniqueNewMessages];
  
        db.transaction(tx => {
          tx.executeSql(
            "INSERT OR REPLACE INTO messages (chatId, messageData) VALUES (?, ?);",
            [chatId, JSON.stringify(mergedMessages)]
          );
        });
  
        // Update state
        setMessages((prev) => ({ ...prev, [chatId]: mergedMessages }));
  
        return mergedMessages;
      } catch (error) {
        // console.error("Error in fetchMessages:", error);
      }
    }
  };
  
  
  
  
  
  const handleNewMessage = async (chatId, newMessage) => {
    setMessages(prevMessages => {
      const existingMessages = Array.isArray(prevMessages[chatId]) ? prevMessages[chatId] : [];
      const updatedMessages = [...existingMessages, newMessage];
  
      // Update SQLite database
      db.transaction(tx => {
        tx.executeSql(
          "INSERT OR REPLACE INTO messages (chatId, messageData) VALUES (?, ?);",
          [chatId, JSON.stringify(updatedMessages)],
          (_, result) => { console.log("Transaction was successful", result); },
          (_, error) => { console.log("Transaction failed", error); return false; }
        );
      });
      
      return { ...prevMessages, [chatId]: updatedMessages };
    });
  };
  

  return (
    <MessageContext.Provider value={{ messages, fetchMessages, handleNewMessage }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => {
  return useContext(MessageContext);
};
