import React, { useState, useEffect, useRef } from "react";
import { Audio } from "expo-av";
import { TouchableOpacity, Text, View, StyleSheet, Animated, Platform } from "react-native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const AudioPlayer = ({ uri }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const setAudioMode = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync(
          {
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          }
        )
      } catch (e) {
        // console.log("Error. Could not set correct settings.")
      }
    };

    setAudioMode();


    let isMounted = true;
    let animation;

    const loadInitialSound = async () => {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { progressUpdateIntervalMillis: 100 }
        );

        if (isMounted) {
          setSound(newSound);
        }

        newSound.setOnPlaybackStatusUpdate(async (status) => {
          if (isMounted) {
            const currentDuration = status.durationMillis;
            const currentPosition = status.positionMillis;
        
            setDuration(currentDuration);
            setPosition(currentPosition);

            if (status.didJustFinish) {
              await newSound.setPositionAsync(0);
              await newSound.pauseAsync();
              setIsPlaying(false);
            }
        
            if (currentPosition !== undefined && currentDuration > 0) {
              const newProgress = (currentPosition / currentDuration) * 100;
              animation = Animated.timing(progress, {
                toValue: newProgress,
                duration: 100,
                useNativeDriver: false,
              });
              animation.start();
            }
          }
        });
        
        const status = await newSound.getStatusAsync();
        if (isMounted) {
          setDuration(status.durationMillis);
          setIsLoaded(true);
        }
      } catch (error) {
        // console.error("Error loading sound: ", error);
      }
    };
  
    loadInitialSound();

    return () => {
      isMounted = false;
      if (animation) {
        animation.stop();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [uri]);

  const handlePress = async () => {
    if (!sound || !isLoaded) {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri });
        setSound(newSound);
        setIsLoaded(true);
      } catch (error) {
        // console.error("Error loading sound: ", error);
        return;
      }
    }

    if (isPlaying) {
      setIsPlaying(false);
      await sound.pauseAsync();
    } else {
      setIsPlaying(true);
      await sound.playAsync();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress}>
        {isPlaying ? <MaterialIcons name='pause' size={40} style={Platform.OS === 'ios' ? {marginLeft: 10}: {}}/> : <MaterialIcons name="play-arrow" size={40} style={Platform.OS === 'ios' ? {marginLeft: 10}: {}}/>}
      </TouchableOpacity>
      <View style={{ width: 165, height: 10, backgroundColor: '#ddd', borderRadius: 50 }}>
        <Animated.View
          style={{
            width: progress.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            height: 10,
            backgroundColor: 'blue',
            borderRadius: 50,
          }}
        />
      </View>
      <View style={styles.secondsDisplay}>
        {position === 0 ? 
          <Text style={styles.secondsDisplayText}>{Math.floor(duration / 60000)}:{String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}</Text> :  
          <Text style={styles.secondsDisplayText}>{Math.floor(position / 60000)}:{String(Math.floor((position % 60000) / 1000)).padStart(2, '0')}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondsDisplay: {
    marginLeft: 10,
    marginRight: 20,
  },
  secondsDisplayText: {
    fontSize: 20,
    color: 'red'
  },
})

export default AudioPlayer;
