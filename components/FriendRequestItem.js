import React, {useState} from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useSocket } from "./SocketContext";
import { useUserContext } from "./UserContext";
import { useNavigation } from "@react-navigation/native";
const FriendRequestItem = ({ profile, onClose }) => {
  const [added, setAdded] = useState(false);
  const navigation = useNavigation();
  const {userData} = useUserContext();
  const socket = useSocket();



  const addFriend = () => {
        if (socket) {
            socket.emit('add_friend', { chat_id: profile.chatId, user_id: userData.id, other_id: profile.otherId })
        }
    }

  
  const navigateToProfile = () => {
    onClose(false);
    navigation.navigate('Profile', {chatmateId: profile.otherId})
  }


    return (
      <View style={styles.requesterItem}>
        <View style={styles.profileCircle}>
          <TouchableOpacity onPress={navigateToProfile}>
          <Image source={{ uri: profile.pfp }} style={styles.profile_image} />
          </TouchableOpacity>
        </View>
    
        <View style={styles.nameContainer}>
          <Text style={styles.chatTitle}>{profile.title} sent you a friend request!</Text>
          { added ? (
            <Text style={styles.addedText}>Added</Text>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.acceptButton} onPress={() => {addFriend(); setAdded(true);}}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
          }

const styles = StyleSheet.create({
  addedText: {
    marginTop: 10,
    color: 'green',
  },
  requesterItem: {
    width: 'auto',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "gray",
    flexDirection: "row",
    alignItems: "center",
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "lightblue",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profile_image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  chatTitle: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 40,
  },
  nameContainer: {
    marginLeft: 25,
    flexDirection: "column",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: "green",
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
  },
});


export default FriendRequestItem;
