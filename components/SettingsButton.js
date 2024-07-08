import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Button, StyleSheet, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from './AuthContext';
import { useUserContext } from './UserContext';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import config from '../config';

const SettingsButton = ({ reportedId, reportedPfp }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [elaboration, setElaboration] = useState('');
  const { authToken } = useAuth();

  const handleReport = async () => {
    try {
      const payload = {
        description: elaboration
      }
      response = await axios.post(`${config.BASE_URL}/report-bug`, payload, {
        headers: {
          Authorization: authToken
        }
      })
      if (response.status === 200) {
        alert('Report successfully submitted');
        setModalVisible(false);
      }
    } catch (error) {
      // console.error(`Failed to report: ${error}`);
      alert('Failed to submit report');
    }
  };

  return (
    <View style={{position: 'absolute', right: 10, marginLeft: 10,}}>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={{flexDirection: 'row', alignItems: 'center'}}>
        <Icon name="alert-circle" size={25} color="grey" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
          >
            <View style={styles.container}>
              <Text style={styles.title}>Report Bug</Text>
              <View style={styles.descriptionView}>
                <Text style={styles.descriptionText}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  value={elaboration}
                  placeholder='Description'
                  onChangeText={setElaboration}
                  multiline
                  numberOfLines={20}
                  textAlignVertical='top'
                />
              </View>
              <Button title="Submit Report" onPress={handleReport} style={styles.buttons}/>
              <Button title="Cancel" onPress={() => setModalVisible(false)} style={styles.buttons}/>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    height: '100%'
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    padding: 10,
  },
  noteText: {
    opacity: 0.5,
    marginBottom: 10,
  },
  pickerView: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  picker: {
    width: '60%'
  },
  pickerText: {
    marginLeft: 10,
    fontWeight: 'bold'
  },
  descriptionView: {
    marginTop: 10,
    marginLeft: 10,
  },
  descriptionText: {
    fontWeight: 'bold'
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    fontSize: 16,
    marginTop: 5,
    width: '95%',
    maxHeight: '70%',
  },
  buttons: {
    marginBottom: 100,
  },

});

export default SettingsButton;