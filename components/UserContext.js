import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateProfileDataRemotely } from "./UpdateAPIData";
import { useAuth } from './AuthContext';
import { requestInformation } from './DataRequest';
const PROFILE_DATA_KEY = 'profileData';

const UserContext = createContext();


  

export const UserProvider = ({ children }) => {
    const { authToken } = useAuth(); 
    const [userData, setUserData] = useState([]);

    const storeProfileDataLocally = async (data) => {
        try {
            await AsyncStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(data));    
            setUserData(data);
        } catch (error) {
            // console.log('Error storing data: ', error);
        }
    };
    
    const getLocalProfileData = async () => {
        try {
            const data = await AsyncStorage.getItem(PROFILE_DATA_KEY)
            return data ? JSON.parse(data) : null;
        } catch (error) {
            // console.log('Error retrieving data: ', error);
            return null;
        }
    };
    
    const updateProfileData = async (newData, authToken) => {
        const currentData = await getLocalProfileData();
        const updatedData = { ...currentData, ...newData };
    
        setUserData(updatedData);
        // console.log("UPDATED DATA", updatedData)
        await storeProfileDataLocally(updatedData);
        await updateProfileDataRemotely(updatedData, authToken);
    };
    
    
    const updateProfileDataLocally = async (newData) => {
        const currentData = await getLocalProfileData();
        const updatedData = { ...currentData, ...newData };
    
        setUserData(updatedData);
        await storeProfileDataLocally(updatedData);
    };

    useEffect(() => {
        const reload = async () => {
            const data = await requestInformation(authToken);
            await updateProfileDataLocally(data);
        }

        if (userData == undefined || userData.id === undefined && authToken) {
            // console.log("DETECTED MAJOR ERROR. NO PROFILE DATA. RELOADING.")
            reload();
        }
    }, [userData])

    return (
        <UserContext.Provider value={{ userData, updateProfileData, getLocalProfileData, updateProfileDataLocally, setUserData, storeProfileDataLocally, }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};
