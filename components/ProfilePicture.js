import React, {useEffect, useState } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import CachedImage from "./CachedImage";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useUserContext } from "./UserContext";
import { useSocket } from "./SocketContext";
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system';
import config from "../config";


const ProfilePicture = ({ imageSource, isOwnProfile, userId}) => {
    const socket = useSocket();
    const { authToken } = useAuth();
    const { updateProfileData } = useUserContext();
    const [modalVisible, setModalVisible] = useState(false);
    const [localImageUri, setLocalImageUri] = useState('');
    const [imageUri, setImageUri] = useState(imageSource);
    const [forceUpdate, setForceUpdate] = useState(false);

    const uploadImage = async (image) => {
        try {
          const formData = new FormData();
          const imageName = image.split('/').pop();
          const imageType = `image/${image.split('.').pop()}`;
      
          formData.append('image', {
            uri: image,
            name: imageName,
            type: imageType,
          });
      
      
          const head = {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          };

      
          const uploadResponse = await axios.post(`${config.BASE_URL}/upload`, formData, head);
      
      
          if (uploadResponse.status === 200) {
            const url = uploadResponse.data.url;
            if (socket) {
              socket.emit('pfp_update', {'userId': userId, 'pfp': url});
            }
            return url;
          } else {
          }
        } catch (error) {
        }
      };
      
      


    const toggleModal = () => {
        setModalVisible(!modalVisible);
    };

    const pickImage = async () => {
        await ImagePicker.requestMediaLibraryPermissionsAsync();

        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          aspect: [4, 3],
        });
    
        if (!result.canceled) {
            try {
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

                setLocalImageUri(compressedImage.uri);
                const url = await uploadImage(compressedImage.uri)
                setImageUri(url);
                setForceUpdate(true);
            } catch (e) {
            }
          }  else {
          }
          
      }
    

    
   
    return (
        <View style={[styles.container]}>
            <TouchableOpacity onPress={() => {
                if (isOwnProfile) {
                    pickImage();
                } else {
                    toggleModal();
                }
                
            }}>
                {/* <CachedImage
                    source={{ uri: imageUri }}
                    cacheKey={"user" + userId}
                    style={styles.profile_image}
                    forceUpdate={forceUpdate}
                    localUri={localImageUri}
                    userId={userId}
                    isOwnProfile={isOwnProfile}
                /> */}
                <Image 
                    source={{uri: imageUri}}
                    style={styles.profile_image}
                />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={toggleModal}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalContent} onPress={toggleModal}>
                    {/* <CachedImage
                    key={imageUri}
                    source={{ uri: imageUri }}
                    cacheKey={"user" + userId}
                    style={{height: 400, width: 400, resizeMode: 'cover'}}
                    userId={userId}
                /> */}
                <Image 
                    source={{uri: imageUri}}
                    style={{height: 400, width: 400, resizeMode: 'cover'}}
                />
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'lightblue',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        alignSelf: 'center',
        marginTop: 10,
    },
    profile_image: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    enlarged_image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});

export default ProfilePicture;