import axios from "axios";
import * as Notifications from 'expo-notifications';
import config from "../config";

export const registerForPushNotificationsAsync = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert("No notification permissions!")
      return; 
    } 
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: '4820232e-39b6-4780-825d-5d09708c71ce' })).data;
    return token
  };