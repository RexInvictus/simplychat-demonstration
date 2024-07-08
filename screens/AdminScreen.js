import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TextInput, ScrollView } from 'react-native';
import axios from 'axios';
import { useUserContext } from '../components/UserContext';
import { useAuth } from '../components/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { useSocket } from '../components/SocketContext';
import config from '../config';

const AdminScreen = () => {
  const socket = useSocket();
  const navigation = useNavigation();
  const { authToken } = useAuth();
  const { userData } = useUserContext();
  const [currentIndex, setCurrentIndex] = useState(0); // New state variable
  const [reports, setReports] = useState([]);
  const [password, setPassword] = useState('');
  const [otherInfo, setOtherInfo] = useState();

  useEffect(() => {
    if (userData?.id !== 1) {
      alert('UNAUTHORIZED ACCESS');
      navigation.navigate('Register');
    }
  }, [userData]);

    const fetchReports = async () => {
        try {
            const response = await axios.get(`${config.BASE_URL}/1admin1/request-reports?userId=${userData.id}&password=${password}`, {
                headers: {
                    Authorization: authToken
                }
            });
            if (response.status === 200) {
                const responseReports = response.data.reports;
                // console.log("Reports", responseReports)
                setReports(responseReports);
            }
        } catch (e) {
            // console.error(e);
        }
    };

    const groupReportsByReported = () => {
        const groupedReports = {};
        
        reports.forEach((report) => {
            if (!groupedReports[report.reported]) {
                groupedReports[report.reported] = [];
            }
            
            groupedReports[report.reported].push(report);
        });
        
        return Object.keys(groupedReports).map((reported) => {
            return { reported, reports: groupedReports[reported] };
        });
    };

    const groupedReports = groupReportsByReported();


    const banUser = async (user, duration, password, reportId, reason) => {
        try {
            const response = await axios.post(`${config.BASE_URL}/1admin1/ban-user`, { 'user': user, 'duration': duration, 'password': password, 'reportId': reportId, 'reason': reason }, {
                headers: {
                    Authorization: authToken
                }
            })

            if (response.status === 200) {
                alert("user", user,  "successfully banned"); // temporary ?
                socket.emit("ban_user", { 'user': user, 'duration': duration, 'reason': reason });

            } else {
                alert("banning user", user, "was unsuccessful");

            }
        } catch (e) {
            // console.error(e);
        }
    };

    const removeProfilePicture = async (user, password, reportId) => {
        try {
            const response = await axios.post(`${config.BASE_URL}/1admin1/remove-pfp`, {'user': user, 'password': password}, {
                headers: {
                    Authorization: authToken
                }
            });

            if (response.status === 200) {
                alert("successfully removed pfp of ", user);
                socket.emit('pfp_update', {'userId': user, 'pfp': 'https://d1zmmxvc41334f.cloudfront.net/pfp.png'})
            }
        } catch (e) {
            // console.error(e);
        }
    };


    const warnUser = async (user, password, reportId, reason) => {
        try {
            const response = await axios.post(`${config.BASE_URL}/1admin1/warn-user`, {'user': user, 'password': password, 'reportId': reportId, 'reason': reason}, {
                headers: {
                    Authorization: authToken
                }
            });

            if (response.status === 200) {
                alert("successfully warned", user);
                socket.emit('warn_user', { 'user': user, 'reason': reason });
            }
        } catch (e) {
            // console.error(e);
        }
    };


    const acquitUser = async (user, password, reportId) => {
        try {
            const response = await axios.post(`${config.BASE_URL}/1admin1/acquit-user`, {'user': user, password: password, reportId}, {
                headers: {
                    Authorization: authToken
                }
            });

            if (response.status === 200) {
                alert("successfully acquitted", user);
            }
        } catch (e) {
            // console.error(e);
        }
    };

    const getMoreInfo = async (userId) => {
        try {
            const response = await axios.get(`${config.BASE_URL}/serve-user-data?userId=${userId}`, {
                headers: {
                    Authorization: authToken
                }
            });
            
            if (response.status === 200) {
                setOtherInfo(response.data);
            }

        } catch (e) {
            // console.error(e);
        }
    };

    useEffect(() => {
        setOtherInfo();
    }, [currentIndex])
    

    return (
        <FlatList
        ListHeaderComponent={
            <>
              <Text style={{textAlign: 'center', fontSize: 20}}>Admin Screen</Text>
              <TextInput
                style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginVertical: 10, }}
                onChangeText={setPassword}
                value={password}
                placeholder="Enter Admin Password"
                secureTextEntry={true}
                onSubmitEditing={fetchReports}
              />
              <Text style={{marginTop: 10, fontSize: 15,}}>Total Reports: {groupedReports.length}</Text>
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderBottomColor: 'gray', borderBottomWidth: 2,}}>
              <Button onPress={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}>Previous</Button>
              <Button onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, groupedReports.length - 1))}>Next</Button>
              </View>
              {groupedReports.length > 0 && (
                <>
                    <Text style={{textAlign: 'center', fontSize: 20,}}>Reported Individual:</Text>
                    <View style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderBottomColor: 'gray', borderBottomWidth: 2,}}>
                    <Text>ID: {groupedReports[currentIndex].reported}</Text>
                    {otherInfo && (
                        <>
                        <Text>USERNAME: {otherInfo.username}</Text>
                        <Text>DESCRIPTION: {otherInfo.description}</Text>
                        <Text>INTERESTS: {otherInfo.interests}</Text>
                        <Text>STRIKES: {otherInfo.strikes}</Text>
                        <Text>PROFILE PICTURE:</Text>
                        <Image 
                        source={{uri: otherInfo.pfp}}
                        style={{ height: 200, width: 200, backgroundColor: 'blue', resizeMode: 'cover' }}
                        />
                        </>
                    )}
                    <Button onPress={() => getMoreInfo(groupedReports[currentIndex].reported)}>More Info</Button>
                    </View>
                    <Text style={{textAlign: 'center', fontSize: 20,}}>Reports:</Text>
                </>
                )}
            </>
        }
          
          data={groupedReports.length > 0 ? groupedReports[currentIndex].reports : []}
          keyExtractor={(report) => report.id.toString()}
          renderItem={({ item: report }) => (
            <View>
              <Text>Reported By: {report.reporter}</Text>
              <Text>Reason: {report.reason}</Text>
              <Text>Elaboration: {report.elaboration}</Text>
              <Image source={{ uri: report.pfp }} style={{ height: 200, width: 200, backgroundColor: 'blue', resizeMode: 'cover' }} />
            </View>
          )}
          ListFooterComponent={
            groupedReports.length > 0 && (
              <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                <Button onPress={() => removeProfilePicture(groupedReports[currentIndex].reported, password)}>Remove Profile Picture</Button>
                <Button onPress={() => banUser(groupedReports[currentIndex].reported, 100, password, groupedReports[currentIndex].reports[0].id, groupedReports[currentIndex].reports[0].reason)}>Ban forever</Button>
                <Button onPress={() => banUser(groupedReports[currentIndex].reported, 7, password, groupedReports[currentIndex].reports[0].id, groupedReports[currentIndex].reports[0].reason)}>Ban 1 week</Button>
                <Button onPress={() => banUser(groupedReports[currentIndex].reported, 1, password, groupedReports[currentIndex].reports[0].id, groupedReports[currentIndex].reports[0].reason)}>Ban 1 day</Button>
                <Button onPress={() => warnUser(groupedReports[currentIndex].reported, password, groupedReports[currentIndex].reports[0].id, groupedReports[currentIndex].reports[0].reason)}>Warn</Button>
                <Button onPress={() => acquitUser(groupedReports[currentIndex].reported, password, groupedReports[currentIndex].reports[0].id)}>Acquit</Button>
              </View>
            )
          }
        />
      );
      
    
};

export default AdminScreen;
