import React from "react";
import { View, Image, StyleSheet } from 'react-native';
import CachedImage from "./CachedImage";


const SmallerProfilePicture = ({ imageSource, userId }) => {
    return (
        <View style={styles.container}>
            {/* <CachedImage
                    key={imageSource}
                    source={{ uri: imageSource }}
                    cacheKey={"user" + userId}
                    style={styles.profileImage}
                    userId={userId}
                /> */}
            <Image 
                source={{uri: imageSource}}
                style={styles.profileImage}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 45,
        height: 45,
        borderRadius: 50,
        backgroundColor: 'lightblue',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginRight: 30,
    },
    profileImage: {
        width: 55,
        height: 55,
        borderRadius: 50,
    },
});

export default SmallerProfilePicture;
