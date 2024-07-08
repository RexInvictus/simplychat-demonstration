import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';

const CheckBox = ({ label_, checked, onChange }) => {
  return (
    <View>
      <Checkbox.Item 
        label={label_}
        status={checked ? 'checked' : 'unchecked'}
        onPress={onChange}
        style={styles.background}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#3E3E3E',
  }
});

export default CheckBox;
