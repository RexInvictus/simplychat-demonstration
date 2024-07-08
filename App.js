import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator'; 
import { AuthProvider } from './components/AuthContext';
import { UserProvider } from './components/UserContext';
import { SocketProvider } from './components/SocketContext';
import { ChatProvider } from './components/ChatContext';
import { MessageProvider } from './components/MessageContext';
import { AdContextProvider } from './components/UseAds';



export default function App() {

  return (
    <AuthProvider>
        <UserProvider>
          <AdContextProvider>
            <NavigationContainer>
             <ChatProvider>
               <MessageProvider>
                  <SocketProvider>
                    <AppNavigator />
                  </SocketProvider>
                </MessageProvider>
              </ChatProvider>
          </NavigationContainer>
          </AdContextProvider>
        </UserProvider>
      </AuthProvider>
  );
}