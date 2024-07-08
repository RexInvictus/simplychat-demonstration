import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

const AgeSlider = ({ minAge, maxAge, onChange, label, value, lowerLimit, upperLimit }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.rangeText}>{minAge}</Text>
        <Slider
          style={styles.slider}
          value={value}
          minimumValue={minAge}
          maximumValue={maxAge}
          onValueChange={onChange}
          step={1}
          lowerLimit={lowerLimit}
          upperLimit={upperLimit}
        />
        <Text style={styles.rangeText}>{maxAge}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
    marginBottom: 0,
  },
  label: {
    marginLeft: 5,
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
  },
  rangeText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: 'white',
  },
});

export default React.memo(AgeSlider);
