import React, { useState, useEffect, useRef } from "react";
import { TouchableOpacity, View, Animated, Easing } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Audio } from "expo-av";

const AudioButton = ({ sendAudio, setAudioButtonPressed }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const timeoutRef = useRef(null);

  // For animation
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [isRecording]);

  useEffect(() => {
  if (isRecording && recording) {
    timeoutRef.current = setTimeout(async () => {
      await stopRecording();
      setAudioButtonPressed(false);
    }, 60000);
  }

  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
}, [isRecording, recording]);

  const interpolatedColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0, 0, 255, 0.3)", "rgba(0, 0, 255, 0.7)"],
  });

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
      setAudioButtonPressed(false);
    } else {
      setAudioButtonPressed(true);
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);

      
    } catch (error) {
      // console.error("Failed to start recording: ", error);
    }
  };

  const stopRecording = async () => {
    // Clear the timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Check if recording is null or undefined
    if (!recording) {
      // console.error("Recording is undefined, cannot stop recording");
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      sendAudio("audio", uri);

      setIsRecording(false);
      setRecording(null);
    } catch (error) {
      // console.error("Failed to stop recording: ", error);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={toggleRecording}>
        <Animated.View
          style={{
            borderRadius: 30,
            marginTop: 1,
            backgroundColor: isRecording ? interpolatedColor : "transparent",
            width: 35,
            height: 35,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialIcons
            name={"mic"}
            size={35}
            color={isRecording ? "red" : "black"}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default AudioButton;
