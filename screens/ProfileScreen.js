import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Button,
  Modal,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfilePicture from '../components/ProfilePicture';
import CheckBox from '../components/CheckBox';
import { useUserContext } from '../components/UserContext';
import { useAuth } from '../components/AuthContext';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { requestAdminAccess } from '../components/AdminManager';
import { useNavigation } from '@react-navigation/native';
import ReportButton from '../components/ReportButton';
import config from '../config';



const ProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const { authToken } = useAuth();
  const chatmateId = route.params.chatmateId;
  const isOwnProfile = chatmateId === 0;
  const { userData: ownUserData, updateProfileData } = useUserContext();
  const [chatmateData, setChatmateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [editedDescription, setEditedDescription] = useState(description);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState('');
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [openDMs, setOpenDMs] = useState(false);
  const [age, setAge] = useState(0);
  const latestDescription = useRef(description);
  const latestInterests = useRef(interests);
  const latestOpendms = useRef(openDMs);
  const latestAge = useRef(age);
  const [modalVisible, setModalVisible] = useState(false);


  const updateProfile = async (descrip, inter, opendms, age) => {
    try {
      const updatedUserData = {
        description: descrip,
        interests: inter,
        opendms: opendms,
        age: age,
      };
      // console.log("Updating profile with", updatedUserData)


      await updateProfileData(updatedUserData, authToken);

      if (response.status == 200) {
      }
    } catch (error) {
      // console.log(error)
    }
  };
  
  
  
  
  useEffect(() => {
    latestDescription.current = description;
    latestInterests.current = interests;
    latestOpendms.current = openDMs;
    latestAge.current = age;
  }, [description, interests, openDMs, age])

  useEffect(() => {
    return () => {
      const hasDataChanged = (originalData, currentData) => {
        return (
          originalData.description !== currentData.description ||
          JSON.stringify(originalData.interests) !== JSON.stringify(currentData.interests) ||
          originalData.opendms !== currentData.opendms ||
          originalData.age !== currentData.age
        )
      }

      if (isOwnProfile) {
        const originalData = {
          description: ownUserData.description,
          interests: ownUserData.interests,
          opendms: ownUserData.opendms,
          age: ownUserData.age,
        };

        const currentData = {
          description: latestDescription.current,
          interests: latestInterests.current,
          opendms: latestOpendms.current,
          age: latestAge.current,
        };

        const dataChanged = hasDataChanged(originalData, currentData);
        if (dataChanged) {
          // console.log("Updating profile");
          updateProfile(latestDescription.current, latestInterests.current, latestOpendms.current, latestAge.current);
        }
      };
    }
  }, [])
    
  useEffect(() => {
    const fetchChatmateData = async () => {
      try {
        const response = await axios.get(`${config.BASE_URL}/serve-user-data`, {
          headers: {
            Authorization: authToken
          },
          params: {
            userId: chatmateId
          },
        });

        if (response.status >= 400) {
          throw new Error(`Server responded with a ${response.status} status`);
        }
        const chatmateData = response.data;
        chatmateData.interests = chatmateData.interests.split('&');
        setChatmateData(chatmateData);

        setDescription(chatmateData.description);
        setInterests(chatmateData.interests);
        setAge(chatmateData.age);
      } catch (error) {
        // console.error('There was a problem with fetching chatmate data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isOwnProfile) {
      fetchChatmateData();

    } else {
      setDescription(ownUserData.description);
      if (Array.isArray(ownUserData.interests)) {
        setInterests(ownUserData.interests)
      }
      setAge(ownUserData.age);
      setOpenDMs(ownUserData.opendms);
      setIsLoading(false);
    }
  }, [chatmateId, authToken]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }


  const userData = isOwnProfile ? ownUserData : chatmateData;


  const handleOpenDMsToggle = () => {
    setOpenDMs(!openDMs);
  };

  const handleDescriptionChange = (newDescription) => {
    setEditedDescription(newDescription);

  };

  const toggleDescriptionEditing = () => {
    if (isEditingDescription) {
      setDescription(editedDescription);
    } 
    setIsEditingDescription(!isEditingDescription);
  };

  const handleInterestAdd = () => {
    if (newInterest.trim() !== '' && interests.length < 4 && newInterest.length <= 10) {
      setInterests([...interests, newInterest]);
      setNewInterest('');
      setIsAddingInterest(false);
    }
  };

  const handleInterestRemove = (interestToRemove) => {
    const updatedInterests = interests.filter((interest) => interest !== interestToRemove);
    setInterests(updatedInterests);
  };

  const ageItems = Array.from({ length: 83 }, (_, i) => i + 18).map((age) => ({
    label: age.toString(),
    value: age,
  }));
  
  const selectAge = (selectedAge) => {
    setAge(selectedAge);
    setModalVisible(false);
  };



  


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {userData?.id === 1 && isOwnProfile && 
        <Button onPress={async () => {await requestAdminAccess("Taylam", authToken, userData.id, navigation);}} title='ADMIN'></Button>
        }
        {userData && (
          <ProfilePicture imageSource={userData.pfp} isOwnProfile={isOwnProfile} userId={userData.id}/>
        )}
  
        {userData && (
        <View style={styles.infoView}>
          <Text style={[styles.username, styles.text]}>{userData.username}</Text>
          
          {isOwnProfile && (
            <>
             <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity 
              style={{marginBottom: -5, marginLeft: -30,}}
              onPress={() => setModalVisible(true)}>
                <MaterialIcons name="arrow-drop-down" size={30} />
              </TouchableOpacity>
          <Text style={[styles.text, styles.age]}>{age}, {userData.sex}</Text>
            </View>
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                  setModalVisible(!modalVisible);
                }}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: 'white',
                      padding: 20,
                      width: '80%',
                      maxHeight: '60%',
                    }}
                  >
                    <FlatList
                      data={ageItems}
                      keyExtractor={(item) => item.value.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{ padding: 10 }}
                          onPress={() => selectAge(item.value)}
                        >
                          <Text>{item.label}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </Modal>
              </>
          )}
          {!isOwnProfile && (
          <Text style={[styles.text, styles.age]}>{age}, {userData.sex}</Text>
          )
          }

          <Text style={[styles.text, styles.age]}>{userData.location}</Text>
        </View>
      )}

        
        <View style={styles.inputContainer}>
          {isEditingDescription && isOwnProfile ? (
            <View>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={editedDescription}
                onChangeText={(text) => {
                  const newLinesCount = (text.match(/\n/g) || []).length;
                  if (newLinesCount <= 4) {
                    handleDescriptionChange(text);
                  }
                }}
                placeholder="Enter description"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={250}
              />

              <TouchableOpacity onPress={toggleDescriptionEditing}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.descriptionText}>{description}</Text>
              {isOwnProfile && (
                <TouchableOpacity onPress={toggleDescriptionEditing}>
                  <Text style={styles.editButton}>Edit Description</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
  
        <View style={styles.inputContainer}>
          <View style={styles.interestsHeader}>
            <Text style={[styles.text, styles.caption]}>Interests</Text>
            {isAddingInterest ? (
              <View style={styles.addInterestContainer}>
                <TextInput
                  style={styles.inputInterests}
                  value={newInterest}
                  autoFocus={true}
                  onChangeText={(text) => setNewInterest(text)}
                  placeholder="Add interest"
                  maxLength={10}
                />
                <TouchableOpacity onPress={handleInterestAdd}>
                  <MaterialIcons name='check-circle' style={styles.addButton}></MaterialIcons>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsAddingInterest(false)}>
                  <MaterialIcons  name='cancel' style={styles.cancelButton}></MaterialIcons>
                </TouchableOpacity>
              </View>
            ) : (
              !isAddingInterest && interests.length < 4 && isOwnProfile && (
                <TouchableOpacity onPress={() => setIsAddingInterest(true)}>
                  <MaterialIcons name='add-circle' style={styles.addButton}></MaterialIcons>
                </TouchableOpacity>
              )
            )}
          </View>
          
          <View style={styles.interestsContainer}>
            <View style={styles.column}>
              {interests.slice(0, Math.ceil(interests.length / 2)).map((interest, index) => (
                <View key={index} style={styles.interest}>
                  <Text style={styles.interestText}>{interest}</Text>
                  {isOwnProfile && (
                    <TouchableOpacity onPress={() => handleInterestRemove(interest)}>
                      <Text style={styles.removeInterest}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.column}>
              {interests.slice(Math.ceil(interests.length / 2)).map((interest, index) => (
                <View key={index} style={styles.interest}>
                  <Text style={styles.interestText}>{interest}</Text>
                  {isOwnProfile && (
                    <TouchableOpacity onPress={() => handleInterestRemove(interest)}>
                      <Text style={styles.removeInterest}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
  
        {isOwnProfile && (
          <View style={styles.settings}>
            <Text style={[styles.caption, styles.text]}>Settings</Text>
            <CheckBox label_={"Open DMs"} checked={openDMs} onChange={handleOpenDMsToggle} />
          </View>
        )}
        {!isOwnProfile && 
        
        <ReportButton reportedId={userData.id} reportedPfp={userData.pfp}/>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  infoView: {
    marginBottom: 10,
    marginTop: -20,
  },
  settings: {
    marginTop: 100,
    marginLeft: 10,
    width: '100%',

  },

  container: {
    flex: 1,
    backgroundColor: '#4C4C4C',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  text: {
    color: 'white',
  },
  username: {
    textAlign: 'center',
    fontSize: 30,
    marginTop: 30,
  },
  age: {
    marginTop: 5,
    textAlign: 'center',
  },
  caption: {
    fontSize: 20,
    marginBottom: 5,
  },
  interestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  inputContainer: {
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 5,
    marginBottom: 5,
    color: 'white',
    marginLeft: 10,
  },
  inputInterests: {
    borderWidth: 1,
    borderColor: 'grey',
    padding: 2,
    marginLeft: 10,
    width: 150,
  },
  descriptionText: {
    marginBottom: 5,
    color: 'white',
    marginLeft: 10,
    fontStyle: 'italic',
    marginRight: 5,
  },
  editButton: {
    color: 'blue',
    fontSize: 16,
    marginLeft: 10,
  },
  saveButton: {
    color: 'green',
    fontSize: 16,
    marginTop: 5,
    marginLeft: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginLeft: 10,
  },
  interest: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  interestText: {
    color: 'white',
    marginLeft: 10,
  },
  removeInterest: {
    color: 'red',
    marginLeft: 5,
  },
  addInterestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    color: '#6B7FD7',
    fontSize: 24,
    marginLeft: 10,
  },
  cancelButton: {
    color: 'red',
    fontSize: 24,
    marginLeft: 50,
  },
  multilineInput: {
    height: 100,
  },
});

export default ProfileScreen;