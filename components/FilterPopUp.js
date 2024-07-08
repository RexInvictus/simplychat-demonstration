import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch } from 'react-native';
import AgeSlider from './AgeSlider';

const FilterPopUp = ({ visible, onClose, onGenderChange, onMinAgeChange, onMaxAgeChange, onMatchByInterestsChange}) => {
  const [selectedGender, setSelectedGender] = useState("Any");
  const [selectedMinAge, setSelectedMinAge] = useState(18);
  const [selectedMaxAge, setSelectedMaxAge] = useState(100);

  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => {
    setIsEnabled(previousState => {
      onMatchByInterestsChange(!previousState);
      return !previousState;
    });
  };

  const send_filter_info = () => {
    // console.log("Selected Gender:", selectedGender)
    // console.log("Min age:", selectedMinAge);
    // console.log("Max age:", selectedMaxAge);
    // console.log("Match by interests:", isEnabled);

    onClose();
  };

  const handleGenderChange = (option) => {
    setSelectedGender(option);
    if (option == 'Any') {
    onGenderChange(option);
    } else if (option == 'Men') {
      onGenderChange('Male');
    } else if (option == 'Women') {
      onGenderChange('Female');
    }
  };

  const getButtonStyle = (option) => {
    return selectedGender === option ? styles.selectedGenderButtonTouchable : styles.genderButtonTouchable;
  };
  

  const handleClear = () => {
    setSelectedMaxAge(100);
    onMaxAgeChange(100);

    setSelectedMinAge(18);
    onMinAgeChange(18);

    setSelectedGender("Any");
    onGenderChange('Any');

    setIsEnabled(false);
    onMatchByInterestsChange(false);
  };
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.filterPopup}>
        <Text style={styles.filterText}>Filter/Settings</Text>
        <Text style={styles.buttonText}>Match me with...</Text>
        <View style={styles.genderButtons}>
        <TouchableOpacity style={getButtonStyle("Any")} onPress={() => handleGenderChange("Any")}>
          <Text style={styles.genderText}>Any</Text>
        </TouchableOpacity>
        <TouchableOpacity style={getButtonStyle("Men")} onPress={() => handleGenderChange("Men")}>
          <Text style={styles.genderText}>Men</Text>
        </TouchableOpacity>
        <TouchableOpacity style={getButtonStyle("Women")} onPress={() => handleGenderChange("Women")}>
          <Text style={styles.genderText}>Women</Text>
        </TouchableOpacity>
      </View>

        <AgeSlider
          minAge={18}
          maxAge={100}
          value={selectedMinAge}
          label={"Min age"}
          upperLimit={selectedMaxAge}
          onChange={(value) => {
            setSelectedMinAge(value);
            onMinAgeChange(value);
          }}
        />
        <Text style={styles.minMaxAgeValue}>{selectedMinAge}</Text>

        <AgeSlider
          minAge={18}
          maxAge={100}
          value={selectedMaxAge}
          label={"Max age"}
          lowerLimit={selectedMinAge}
          onChange={(value) => {
            setSelectedMaxAge(value);
            onMaxAgeChange(value);
          }}
        />
        <Text style={styles.minMaxAgeValue}>{selectedMaxAge}</Text>
        <View style={styles.switch_container}>
            <Text style={styles.switch_text}>Match by interests </Text>
            <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isEnabled ? 'white' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
        />
        </View>
        <View style={styles.button_container}>
          <TouchableOpacity onPress={handleClear} style={styles.closeButton}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={send_filter_info} style={styles.closeButton}>
            <Text style={styles.buttonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  minMaxAgeValue: {
    color: 'white',
  },
  genderButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  genderButtonTouchable: {
    padding: 10,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedGenderButtonTouchable: {
    padding: 10,
    width: '33.33%',  // Fixed width
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E4572E',  // or another color to show selection
  },
  genderText: {
    color: 'white',
    fontSize: 15,
  },
  genderButtonTouchable: {
    borderColor: 'gray',
    padding: 10,
    width: '33.33%',  // Fixed width
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPopup: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#4C4C4CE6',
  },
  filterText: {
    marginTop: 30,
    fontSize: 20,
    marginBottom: 20,
    color: 'white',
  },
  closeButton: {
    backgroundColor: '#E4572E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
  },
  button_container: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  switch_container: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 20,
    alignItems: 'center',
  },
  switch_text: {
    color: 'white',
    fontSize: 20
  }
});

export default FilterPopUp;
