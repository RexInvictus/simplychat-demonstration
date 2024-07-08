import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen'
import RegisterScreen from '../screens/RegisterScreen';
import ImageScreen from '../screens/ImageScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createStackNavigator();


const AppNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Register" component={RegisterScreen} options={{headerShown: false}} />
            <Stack.Screen name="Home" component={HomeScreen}
            options={ {headerShown: false}} />
            <Stack.Screen name="Profile" component={ProfileScreen}  />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} options={ {headerShown: false}}/>
            <Stack.Screen name="Image" component={ImageScreen} options={{title: ''}}/>
        </Stack.Navigator>
    );
}


export default AppNavigator;