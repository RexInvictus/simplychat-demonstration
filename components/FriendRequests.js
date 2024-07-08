import React, {useState} from 'react';
import {View, Text, StyleSheet, Dimensions, FlatList } from 'react-native';
import FriendRequestItem from './FriendRequestItem';
import Modal from 'react-native-modal';
import { TouchableOpacity } from 'react-native';

const FriendRequestsPopup = ({ visible, onClose, chats, refresh }) => {
  const reversedChats = chats.reverse()
  const [invisible, setInvisible] = useState(false);
  return (
    <Modal
      animationIn="slideInLeft"
      animationOut='slideOutLeft'
      transparent={true}
      isVisible={visible}
      onRequestClose={() => {onClose(false);}}
      backdropOpacity={0}
      onBackdropPress={() => {onClose(false);}}>
        <View style={[styles.modalView, invisible && styles.invisible]}>
          <Text style={{color: 'white', marginTop: 10, fontWeight: 'bold'}}>Friend Requests</Text>
          <View>
          <FlatList 
          data={reversedChats}
          renderItem={({ item }) => <FriendRequestItem profile={item} onClose={onClose}/>}
          contentContainerStyle={{ paddingBottom: 165 }}
          />
          </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    invisible: {
      display: 'none',
    },
    modalView: {
      borderRadius: 10,
      marginLeft: -20,
      alignItems: 'center',
      width: Dimensions.get('window').width * 0.6,
      height: Dimensions.get('window').height,
      backgroundColor: '#4C4C4C',
      paddingVertical: 20,
      elevation: 5,
    },
  });
  

export default FriendRequestsPopup;
