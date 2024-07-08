import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableHighlight, Image} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { useUserContext } from "./UserContext";
import CachedImage from "./CachedImage";

const ProfileButton = () => {
    const { userData } = useUserContext();
    const navigation = useNavigation();
    const imageUri = userData.pfp;
    const userId = userData.id;
    const [refresh, setRefresh] = useState('');

    const handleProfilePress = () => {
        navigation.navigate('Profile', { chatmateId: 0 });
    };

    useEffect(() => {
        setRefresh(true);
    }, [imageUri])

    return (
        <TouchableHighlight style={styles.button} onPress={handleProfilePress}>
            {/* <CachedImage
                    key={imageUri}
                    source={{ uri: imageUri}}
                    cacheKey={"user" + userId}
                    style={styles.profileImage}
                    userId={userId}
                    isOwnProfile={true}
                    forceUpdate={refresh}
                    test={true}
                /> */}
            <Image 
                source={{uri: imageUri}}
                style={styles.profileImage}
            />
        </TouchableHighlight>
    );
};


const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 50,
        backgroundColor: 'lightblue',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginLeft: 20,
        
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 35,
        overflow: 'hidden',
    },
});


export default ProfileButton