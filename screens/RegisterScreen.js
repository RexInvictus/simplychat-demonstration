import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestInformation } from '../components/DataRequest';
import { useUserContext } from '../components/UserContext';
import { useAuth } from '../components/AuthContext';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import config from '../config';
import { Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';  
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { registerForPushNotificationsAsync } from '../components/PushNotifications';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { updateProfileDataLocally, storeProfileDataLocally, getLocalProfileData } = useUserContext();
  const [step, setStep] = useState(0);  // Step counter
  const [name, setName] = useState('');
  const [age, setAge] = useState('18');
  const [sex, setSex] = useState('');
  const [country, setCountry] = useState('Afghanistan 🇦🇫');
  const [password, setPassword] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const ageItems = Array.from({ length: 83 }, (_, i) => i + 18).map((age) => ({
    label: age.toString(),
    value: age,
  }));

  const countryList = [
    { label: 'Afghanistan 🇦🇫', value: 'Afghanistan 🇦🇫'},
    { label: 'Åland Islands 🇦🇽', value: 'Åland Islands 🇦🇽'},
    { label: 'Albania 🇦🇱', value: 'Albania 🇦🇱'},
    { label: 'Algeria 🇩🇿', value: 'Algeria 🇩🇿'},
    { label: 'American Samoa 🇦🇸', value: 'American Samoa 🇦🇸'},
    { label: 'Andorra 🇦🇩', value: 'Andorra 🇦🇩'},
    { label: 'Angola 🇦🇴', value: 'Angola 🇦🇴'},
    { label: 'Anguilla 🇦🇮', value: 'Anguilla 🇦🇮'},
    { label: 'Antarctica 🇦🇶', value: 'Antarctica 🇦🇶'},
    { label: 'Antigua and Barbuda 🇦🇬', value: 'Antigua and Barbuda 🇦🇬'},
    { label: 'Argentina 🇦🇷', value: 'Argentina 🇦🇷'},
    { label: 'Armenia 🇦🇲', value: 'Armenia 🇦🇲'},
    { label: 'Aruba 🇦🇼', value: 'Aruba 🇦🇼'},
    { label: 'Australia 🇦🇺', value: 'Australia 🇦🇺'},
    { label: 'Austria 🇦🇹', value: 'Austria 🇦🇹'},
    { label: 'Azerbaijan 🇦🇿', value: 'Azerbaijan 🇦🇿'},
    { label: 'Bahamas 🇧🇸', value: 'Bahamas 🇧🇸'},
    { label: 'Bahrain 🇧🇭', value: 'Bahrain 🇧🇭'},
    { label: 'Bangladesh 🇧🇩', value: 'Bangladesh 🇧🇩'},
    { label: 'Barbados 🇧🇧', value: 'Barbados 🇧🇧'},
    { label: 'Belarus 🇧🇾', value: 'Belarus 🇧🇾'},
    { label: 'Belgium 🇧🇪', value: 'Belgium 🇧🇪'},
    { label: 'Belize 🇧🇿', value: 'Belize 🇧🇿'},
    { label: 'Benin 🇧🇯', value: 'Benin 🇧🇯'},
    { label: 'Bermuda 🇧🇲', value: 'Bermuda 🇧🇲'},
    { label: 'Bhutan 🇧🇹', value: 'Bhutan 🇧🇹'},
    { label: 'Bolivia 🇧🇴', value: 'Bolivia 🇧🇴'},
    { label: 'Bosnia and Herzegovina 🇧🇦', value: 'Bosnia and Herzegovina 🇧🇦'},
    { label: 'Botswana 🇧🇼', value: 'Botswana 🇧🇼'},
    { label: 'Bouvet Island 🇧🇻', value: 'Bouvet Island 🇧🇻'},
    { label: 'Brazil 🇧🇷', value: 'Brazil 🇧🇷'},
    { label: 'British Indian Ocean Territory 🇮🇴', value: 'British Indian Ocean Territory 🇮🇴'},
    { label: 'Brunei 🇧🇳', value: 'Brunei 🇧🇳'},
    { label: 'Bulgaria 🇧🇬', value: 'Bulgaria 🇧🇬'},
    { label: 'Burkina Faso 🇧🇫', value: 'Burkina Faso 🇧🇫'},
    { label: 'Burundi 🇧🇮', value: 'Burundi 🇧🇮'},
    { label: 'Cambodia 🇰🇭', value: 'Cambodia 🇰🇭'},
    { label: 'Cameroon 🇨🇲', value: 'Cameroon 🇨🇲'},
    { label: 'Canada 🇨🇦', value: 'Canada 🇨🇦'},
    { label: 'Cape Verde 🇨🇻', value: 'Cape Verde 🇨🇻'},
    { label: 'Caribbean Netherlands 🇧🇶', value: 'Caribbean Netherlands 🇧🇶'},
    { label: 'Cayman Islands 🇰🇾', value: 'Cayman Islands 🇰🇾'},
    { label: 'Central African Republic 🇨🇫', value: 'Central African Republic 🇨🇫'},
    { label: 'Chad 🇹🇩', value: 'Chad 🇹🇩'},
    { label: 'Chile 🇨🇱', value: 'Chile 🇨🇱'},
    { label: 'China 🇨🇳', value: 'China 🇨🇳'},
    { label: 'Christmas Island 🇨🇽', value: 'Christmas Island 🇨🇽'},
    { label: 'Cocos (Keeling) Islands 🇨🇨', value: 'Cocos (Keeling) Islands 🇨🇨'},
    { label: 'Colombia 🇨🇴', value: 'Colombia 🇨🇴'},
    { label: 'Comoros 🇰🇲', value: 'Comoros 🇰🇲'},
    { label: 'Republic of the Congo 🇨🇬', value: 'Republic of the Congo 🇨🇬'},
    { label: 'DR Congo 🇨🇩', value: 'DR Congo 🇨🇩'},
    { label: 'Cook Islands 🇨🇰', value: 'Cook Islands 🇨🇰'},
    { label: 'Costa Rica 🇨🇷', value: 'Costa Rica 🇨🇷'},
    { label: "Côte d'Ivoire (Ivory Coast) 🇨🇮", value: "Côte d'Ivoire (Ivory Coast) 🇨🇮"},
    { label: 'Croatia 🇭🇷', value: 'Croatia 🇭🇷'},
    { label: 'Cuba 🇨🇺', value: 'Cuba 🇨🇺'},
    { label: 'Curaçao 🇨🇼', value: 'Curaçao 🇨🇼'},
    { label: 'Cyprus 🇨🇾', value: 'Cyprus 🇨🇾'},
    { label: 'Czechia 🇨🇿', value: 'Czechia 🇨🇿'},
    { label: 'Denmark 🇩🇰', value: 'Denmark 🇩🇰'},
    { label: 'Djibouti 🇩🇯', value: 'Djibouti 🇩🇯'},
    { label: 'Dominica 🇩🇲', value: 'Dominica 🇩🇲'},
    { label: 'Dominican Republic 🇩🇴', value: 'Dominican Republic 🇩🇴'},
    { label: 'Ecuador 🇪🇨', value: 'Ecuador 🇪🇨'},
    { label: 'Egypt 🇪🇬', value: 'Egypt 🇪🇬'},
    { label: 'El Salvador 🇸🇻', value: 'El Salvador 🇸🇻'},
    { label: 'England 🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: 'England 🏴󠁧󠁢󠁥󠁮󠁧󠁿'},
    { label: 'Equatorial Guinea 🇬🇶', value: 'Equatorial Guinea 🇬🇶'},
    { label: 'Eritrea 🇪🇷', value: 'Eritrea 🇪🇷'},
    { label: 'Estonia 🇪🇪', value: 'Estonia 🇪🇪'},
    { label: 'Eswatini (Swaziland) 🇸🇿', value: 'Eswatini (Swaziland) 🇸🇿'},
    { label: 'Ethiopia 🇪🇹', value: 'Ethiopia 🇪🇹'},
    { label: 'Falkland Islands 🇫🇰', value: 'Falkland Islands 🇫🇰'},
    { label: 'Faroe Islands 🇫🇴', value: 'Faroe Islands 🇫🇴'},
    { label: 'Fiji 🇫🇯', value: 'Fiji 🇫🇯'},
    { label: 'Finland 🇫🇮', value: 'Finland 🇫🇮'},
    { label: 'France 🇫🇷', value: 'France 🇫🇷'},
    { label: 'French Guiana 🇬🇫', value: 'French Guiana 🇬🇫'},
    { label: 'French Polynesia 🇵🇫', value: 'French Polynesia 🇵🇫'},
    { label: 'French Southern and Antarctic Lands 🇹🇫', value: 'French Southern and Antarctic Lands 🇹🇫'},
    { label: 'Gabon 🇬🇦', value: 'Gabon 🇬🇦'},
    { label: 'Gambia 🇬🇲', value: 'Gambia 🇬🇲'},
    { label: 'Georgia 🇬🇪', value: 'Georgia 🇬🇪'},
    { label: 'Germany 🇩🇪', value: 'Germany 🇩🇪'},
    { label: 'Ghana 🇬🇭', value: 'Ghana 🇬🇭'},
    { label: 'Gibraltar 🇬🇮', value: 'Gibraltar 🇬🇮'},
    { label: 'Greece 🇬🇷', value: 'Greece 🇬🇷'},
    { label: 'Greenland 🇬🇱', value: 'Greenland 🇬🇱'},
    { label: 'Grenada 🇬🇩', value: 'Grenada 🇬🇩'},
    { label: 'Guadeloupe 🇬🇵', value: 'Guadeloupe 🇬🇵'},
    { label: 'Guam 🇬🇺', value: 'Guam 🇬🇺'},
    { label: 'Guatemala 🇬🇹', value: 'Guatemala 🇬🇹'},
    { label: 'Guernsey 🇬🇬', value: 'Guernsey 🇬🇬'},
    { label: 'Guinea 🇬🇳', value: 'Guinea 🇬🇳'},
    { label: 'Guinea-Bissau 🇬🇼', value: 'Guinea-Bissau 🇬🇼'},
    { label: 'Guyana 🇬🇾', value: 'Guyana 🇬🇾'},
    { label: 'Haiti 🇭🇹', value: 'Haiti 🇭🇹'},
    { label: 'Heard Island and McDonald Islands 🇭🇲', value: 'Heard Island and McDonald Islands 🇭🇲'},
    { label: 'Honduras 🇭🇳', value: 'Honduras 🇭🇳'},
    { label: 'Hong Kong 🇭🇰', value: 'Hong Kong 🇭🇰'},
    { label: 'Hungary 🇭🇺', value: 'Hungary 🇭🇺'},
    { label: 'Iceland 🇮🇸', value: 'Iceland 🇮🇸'},
    { label: 'India 🇮🇳', value: 'India 🇮🇳'},
    { label: 'Indonesia 🇮🇩', value: 'Indonesia 🇮🇩'},
    { label: 'Iran 🇮🇷', value: 'Iran 🇮🇷'},
    { label: 'Iraq 🇮🇶', value: 'Iraq 🇮🇶'},
    { label: 'Ireland 🇮🇪', value: 'Ireland 🇮🇪'},
    { label: 'Isle of Man 🇮🇲', value: 'Isle of Man 🇮🇲'},
    { label: 'Israel 🇮🇱', value: 'Israel 🇮🇱'},
    { label: 'Italy 🇮🇹', value: 'Italy 🇮🇹'},
    { label: 'Jamaica 🇯🇲', value: 'Jamaica 🇯🇲'},
    { label: 'Japan 🇯🇵', value: 'Japan 🇯🇵'},
    { label: 'Jersey 🇯🇪', value: 'Jersey 🇯🇪'},
    { label: 'Jordan 🇯🇴', value: 'Jordan 🇯🇴'},
    { label: 'Kazakhstan 🇰🇿', value: 'Kazakhstan 🇰🇿'},
    { label: 'Kenya 🇰🇪', value: 'Kenya 🇰🇪'},
    { label: 'Kiribati 🇰🇮', value: 'Kiribati 🇰🇮'},
    { label: 'North Korea 🇰🇵', value: 'North Korea 🇰🇵'},
    { label: 'South Korea 🇰🇷', value: 'South Korea 🇰🇷'},
    { label: 'Kosovo 🇽🇰', value: 'Kosovo 🇽🇰'},
    { label: 'Kuwait 🇰🇼', value: 'Kuwait 🇰🇼'},
    { label: 'Kyrgyzstan 🇰🇬', value: 'Kyrgyzstan 🇰🇬'},
    { label: 'Laos 🇱🇦', value: 'Laos 🇱🇦'},
    { label: 'Latvia 🇱🇻', value: 'Latvia 🇱🇻'},
    { label: 'Lebanon 🇱🇧', value: 'Lebanon 🇱🇧'},
    { label: 'Lesotho 🇱🇸', value: 'Lesotho 🇱🇸'},
    { label: 'Liberia 🇱🇷', value: 'Liberia 🇱🇷'},
    { label: 'Libya 🇱🇾', value: 'Libya 🇱🇾'},
    { label: 'Liechtenstein 🇱🇮', value: 'Liechtenstein 🇱🇮'},
    { label: 'Lithuania 🇱🇹', value: 'Lithuania 🇱🇹'},
    { label: 'Luxembourg 🇱🇺', value: 'Luxembourg 🇱🇺'},
    { label: 'Macau 🇲🇴', value: 'Macau 🇲🇴'},
    { label: 'Madagascar 🇲🇬', value: 'Madagascar 🇲🇬'},
    { label: 'Malawi 🇲🇼', value: 'Malawi 🇲🇼'},
    { label: 'Malaysia 🇲🇾', value: 'Malaysia 🇲🇾'},
    { label: 'Maldives 🇲🇻', value: 'Maldives 🇲🇻'},
    { label: 'Mali 🇲🇱', value: 'Mali 🇲🇱'},
    { label: 'Malta 🇲🇹', value: 'Malta 🇲🇹'},
    { label: 'Marshall Islands 🇲🇭', value: 'Marshall Islands 🇲🇭'},
    { label: 'Martinique 🇲🇶', value: 'Martinique 🇲🇶'},
    { label: 'Mauritania 🇲🇷', value: 'Mauritania 🇲🇷'},
    { label: 'Mauritius 🇲🇺', value: 'Mauritius 🇲🇺'},
    { label: 'Mayotte 🇾🇹', value: 'Mayotte 🇾🇹'},
    { label: 'Mexico 🇲🇽', value: 'Mexico 🇲🇽'},
    { label: 'Micronesia 🇫🇲', value: 'Micronesia 🇫🇲'},
    { label: 'Moldova 🇲🇩', value: 'Moldova 🇲🇩'},
    { label: 'Monaco 🇲🇨', value: 'Monaco 🇲🇨'},
    { label: 'Mongolia 🇲🇳', value: 'Mongolia 🇲🇳'},
    { label: 'Montenegro 🇲🇪', value: 'Montenegro 🇲🇪'},
    { label: 'Montserrat 🇲🇸', value: 'Montserrat 🇲🇸'},
    { label: 'Morocco 🇲🇦', value: 'Morocco 🇲🇦'},
    { label: 'Mozambique 🇲🇿', value: 'Mozambique 🇲🇿'},
    { label: 'Myanmar 🇲🇲', value: 'Myanmar 🇲🇲'},
    { label: 'Namibia 🇳🇦', value: 'Namibia 🇳🇦'},
    { label: 'Nauru 🇳🇷', value: 'Nauru 🇳🇷'},
    { label: 'Nepal 🇳🇵', value: 'Nepal 🇳🇵'},
    { label: 'Netherlands 🇳🇱', value: 'Netherlands 🇳🇱'},
    { label: 'New Caledonia 🇳🇨', value: 'New Caledonia 🇳🇨'},
    { label: 'New Zealand 🇳🇿', value: 'New Zealand 🇳🇿'},
    { label: 'Nicaragua 🇳🇮', value: 'Nicaragua 🇳🇮'},
    { label: 'Niger 🇳🇪', value: 'Niger 🇳🇪'},
    { label: 'Nigeria 🇳🇬', value: 'Nigeria 🇳🇬'},
    { label: 'Niue 🇳🇺', value: 'Niue 🇳🇺'},
    { label: 'Norfolk Island 🇳🇫', value: 'Norfolk Island 🇳🇫'},
    { label: 'North Macedonia 🇲🇰', value: 'North Macedonia 🇲🇰'},
    { label: 'Northern Mariana Islands 🇲🇵', value: 'Northern Mariana Islands 🇲🇵'},
    { label: 'Norway 🇳🇴', value: 'Norway 🇳🇴'},
    { label: 'Oman 🇴🇲', value: 'Oman 🇴🇲'},
    { label: 'Pakistan 🇵🇰', value: 'Pakistan 🇵🇰'},
    { label: 'Palau 🇵🇼', value: 'Palau 🇵🇼'},
    { label: 'Palestine 🇵🇸', value: 'Palestine 🇵🇸'},
    { label: 'Panama 🇵🇦', value: 'Panama 🇵🇦'},
    { label: 'Papua New Guinea 🇵🇬', value: 'Papua New Guinea 🇵🇬'},
    { label: 'Paraguay 🇵🇾', value: 'Paraguay 🇵🇾'},
    { label: 'Peru 🇵🇪', value: 'Peru 🇵🇪'},
    { label: 'Philippines 🇵🇭', value: 'Philippines 🇵🇭'},
    { label: 'Pitcairn Islands 🇵🇳', value: 'Pitcairn Islands 🇵🇳'},
    { label: 'Poland 🇵🇱', value: 'Poland 🇵🇱'},
    { label: 'Portugal 🇵🇹', value: 'Portugal 🇵🇹'},
    { label: 'Puerto Rico 🇵🇷', value: 'Puerto Rico 🇵🇷'},
    { label: 'Qatar 🇶🇦', value: 'Qatar 🇶🇦'},
    { label: 'Réunion 🇷🇪', value: 'Réunion 🇷🇪'},
    { label: 'Romania 🇷🇴', value: 'Romania 🇷🇴'},
    { label: 'Russia 🇷🇺', value: 'Russia 🇷🇺'},
    { label: 'Rwanda 🇷🇼', value: 'Rwanda 🇷🇼'},
    { label: 'Saint Barthélemy 🇧🇱', value: 'Saint Barthélemy 🇧🇱'},
    { label: 'Saint Helena, Ascension and Tristan da Cunha 🇸🇭', value: 'Saint Helena, Ascension and Tristan da Cunha 🇸🇭'},
    { label: 'Saint Kitts and Nevis 🇰🇳', value: 'Saint Kitts and Nevis 🇰🇳'},
    { label: 'Saint Lucia 🇱🇨', value: 'Saint Lucia 🇱🇨'},
    { label: 'Saint Martin 🇲🇫', value: 'Saint Martin 🇲🇫'},
    { label: 'Saint Pierre and Miquelon 🇵🇲', value: 'Saint Pierre and Miquelon 🇵🇲'},
    { label: 'Saint Vincent and the Grenadines 🇻🇨', value: 'Saint Vincent and the Grenadines 🇻🇨'},
    { label: 'Samoa 🇼🇸', value: 'Samoa 🇼🇸'},
    { label: 'San Marino 🇸🇲', value: 'San Marino 🇸🇲'},
    { label: 'São Tomé and Príncipe 🇸🇹', value: 'São Tomé and Príncipe 🇸🇹'},
    { label: 'Saudi Arabia 🇸🇦', value: 'Saudi Arabia 🇸🇦'},
    { label: 'Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿', value: 'Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿'},
    { label: 'Senegal 🇸🇳', value: 'Senegal 🇸🇳'},
    { label: 'Serbia 🇷🇸', value: 'Serbia 🇷🇸'},
    { label: 'Seychelles 🇸🇨', value: 'Seychelles 🇸🇨'},
    { label: 'Sierra Leone 🇸🇱', value: 'Sierra Leone 🇸🇱'},
    { label: 'Singapore 🇸🇬', value: 'Singapore 🇸🇬'},
    { label: 'Sint Maarten 🇸🇽', value: 'Sint Maarten 🇸🇽'},
    { label: 'Slovakia 🇸🇰', value: 'Slovakia 🇸🇰'},
    { label: 'Slovenia 🇸🇮', value: 'Slovenia 🇸🇮'},
    { label: 'Solomon Islands 🇸🇧', value: 'Solomon Islands 🇸🇧'},
    { label: 'Somalia 🇸🇴', value: 'Somalia 🇸🇴'},
    { label: 'South Africa 🇿🇦', value: 'South Africa 🇿🇦'},
    { label: 'South Georgia 🇬🇸', value: 'South Georgia 🇬🇸'},
    { label: 'South Sudan 🇸🇸', value: 'South Sudan 🇸🇸'},
    { label: 'Spain 🇪🇸', value: 'Spain 🇪🇸'},
    { label: 'Sri Lanka 🇱🇰', value: 'Sri Lanka 🇱🇰'},
    { label: 'Sudan 🇸🇩', value: 'Sudan 🇸🇩'},
    { label: 'Suriname 🇸🇷', value: 'Suriname 🇸🇷'},
    { label: 'Svalbard and Jan Mayen 🇸🇯', value: 'Svalbard and Jan Mayen 🇸🇯'},
    { label: 'Sweden 🇸🇪', value: 'Sweden 🇸🇪'},
    { label: 'Switzerland 🇨🇭', value: 'Switzerland 🇨🇭'},
    { label: 'Syria 🇸🇾', value: 'Syria 🇸🇾'},
    { label: 'Taiwan 🇹🇼', value: 'Taiwan 🇹🇼'},
    { label: 'Tajikistan 🇹🇯', value: 'Tajikistan 🇹🇯'},
    { label: 'Tanzania 🇹🇿', value: 'Tanzania 🇹🇿'},
    { label: 'Thailand 🇹🇭', value: 'Thailand 🇹🇭'},
    { label: 'Timor-Leste 🇹🇱', value: 'Timor-Leste 🇹🇱'},
    { label: 'Togo 🇹🇬', value: 'Togo 🇹🇬'},
    { label: 'Tokelau 🇹🇰', value: 'Tokelau 🇹🇰'},
    { label: 'Tonga 🇹🇴', value: 'Tonga 🇹🇴'},
    { label: 'Trinidad and Tobago 🇹🇹', value: 'Trinidad and Tobago 🇹🇹'},
    { label: 'Tunisia 🇹🇳', value: 'Tunisia 🇹🇳'},
    { label: 'Turkey 🇹🇷', value: 'Turkey 🇹🇷'},
    { label: 'Turkmenistan 🇹🇲', value: 'Turkmenistan 🇹🇲'},
    { label: 'Turks and Caicos Islands 🇹🇨', value: 'Turks and Caicos Islands 🇹🇨'},
    { label: 'Tuvalu 🇹🇻', value: 'Tuvalu 🇹🇻'},
    { label: 'Uganda 🇺🇬', value: 'Uganda 🇺🇬'},
    { label: 'Ukraine 🇺🇦', value: 'Ukraine 🇺🇦'},
    { label: 'United Arab Emirates 🇦🇪', value: 'United Arab Emirates 🇦🇪'},
    { label: 'United Kingdom 🇬🇧', value: 'United Kingdom 🇬🇧'},
    { label: 'United States 🇺🇸', value: 'United States 🇺🇸'},
    { label: 'United States Minor Outlying Islands 🇺🇲', value: 'United States Minor Outlying Islands 🇺🇲'},
    { label: 'Uruguay 🇺🇾', value: 'Uruguay 🇺🇾'},
    { label: 'Uzbekistan 🇺🇿', value: 'Uzbekistan 🇺🇿'},
    { label: 'Vanuatu 🇻🇺', value: 'Vanuatu 🇻🇺'},
    { label: 'Vatican City (Holy See) 🇻🇦', value: 'Vatican City (Holy See) 🇻🇦'},
    { label: 'Venezuela 🇻🇪', value: 'Venezuela 🇻🇪'},
    { label: 'Vietnam 🇻🇳', value: 'Vietnam 🇻🇳'},
    { label: 'British Virgin Islands 🇻🇬', value: 'British Virgin Islands 🇻🇬'},
    { label: 'United States Virgin Islands 🇻🇮', value: 'United States Virgin Islands 🇻🇮'},
    { label: 'Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿', value: 'Wales 🏴󠁧󠁢󠁷󠁬󠁳󠁿'},
    { label: 'Wallis and Futuna 🇼🇫', value: 'Wallis and Futuna 🇼🇫'},
    { label: 'Western Sahara 🇪🇭', value: 'Western Sahara 🇪🇭'},
    { label: 'Yemen 🇾🇪', value: 'Yemen 🇾🇪'},
    { label: 'Zambia 🇿🇲', value: 'Zambia 🇿🇲'},
    { label: 'Zimbabwe 🇿🇼', value: 'Zimbabwe 🇿🇼'},
    ];

  
  useEffect(() => {
    
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
  
    const clearCache = async () => {
      // console.log("Clearing cache...");
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      // console.log("Cleared cache...");
    };
  
    const determineIfRegistered = async () => {
      const userData = await getLocalProfileData();
      const moveToRegister = async () => {
        // console.log("generating unique id...");
        uniqueId = generateUUID();
        // uniqueId = '<%,FHDL~aSr2wj.4^HcJ';
        await AsyncStorage.setItem('uniqueId', uniqueId);
        setPassword(uniqueId);
        goToNextStep();
      }

      // await clearCache(); // Make sure cache is cleared before proceeding
      
      let uniqueId = await AsyncStorage.getItem('uniqueId');
      // console.log("unique id", uniqueId);
      
      if (!uniqueId) {
        await moveToRegister();
      } else {
        try {
          await handleLogin(userData.id, uniqueId);
        } catch {
          // console.log("registering")
          await moveToRegister();
        }
      }
    };
  
    determineIfRegistered();
  }, []);

  
  const handleLogin = async (userId, pass) => {
    try {
      const response = await axios.post(`${config.BASE_URL}/login`, {
        id: userId,
        password: pass,
      });
      const token = response.data.token

      await AsyncStorage.setItem('authToken', token);
      login(token);
      if (response.status == 200) {
        const data = await requestInformation(token);
        await updateProfileDataLocally(data);
        if (response.data.displayWarning) {
          alert('You have received a warning for: ' + response.data.displayWarning + '\nIf you do it again you will receive a ban.');
          await axios.post(`${config.BASE_URL}/acknowledge-warning`, {'userId': profileData.id})
        }
        navigation.navigate("Home");
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alert('You have been banned for breaching the following rule: ' + error.response.data.reason + "\n\n Your ban will expire on " + error.response.data.duration); 
      } else {
        // console.error('Error:', error);
      }
      if (error.response.status === 400) {
        throw error;
      }
    }
    
  };

  const handleRegister = async () => {
    setIsButtonDisabled(true);
    if (name === '<%,FHDL~aSr2wj.4^HcJ' && age === 88 && country === 'Cocos (Keeling) Islands 🇨🇨' && sex === 'Female') {
      handleLogin(1, name);
      return;
    }
    try {
      let imageUrl = 'https://d1zmmxvc41334f.cloudfront.net/pfp.png'
      const notifToken = await registerForPushNotificationsAsync();
      const response = await axios.post(`${config.BASE_URL}/register`, {
        username: name,
        password: password,
        pfp: imageUrl,
        age: age,
        sex: sex,
        location: country,
        token: notifToken,
      });

      if (response.status == 200) {
        Alert.alert('Success', response.data.message);

        // storing profile data locally
        const profileData = {
          username: name,
          password: password,
          age: age,
          sex: sex,
          pfp: imageUrl,
          location: country,
        };
        await storeProfileDataLocally(profileData);

        handleLogin(response.data.userId, password);
      }
      else {
        Alert.alert('Registration failed', response.data.message)
      }
    } catch(error) {
      // console.error('Error:', error);
      alert(error)
      setIsButtonDisabled(false);
    }
  };
  // General function to move to the next step
  const goToNextStep = () => {
    // console.log("Going to next step...")
    setStep(prevStep => prevStep + 1);
  };

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardOffset(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardOffset(0)
    );
  
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  
  return (
    <View style={styles.container}>
      {/* Step 0: Blank Screen */}
      {step === 0 && (
        <LinearGradient colors={['#E4572E', '#DD5227', '#F05B2E', ]} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
        <View style={styles.welcomeView}>
          <MaterialIcons name="chat-bubble" size={40} color={'white'} style={styles.logo}/>
          <Text style={styles.logoText}>SimpleChat™</Text>
        </View>
      </LinearGradient>
      )}

      {/* Step 1: Register Screen */}
      {step === 1 && (
        
      <LinearGradient colors={['#E4572E', '#DD5227', '#F05B2E', ]} style={{width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
      <View style={styles.welcomeView}>
        <MaterialIcons name="chat-bubble" size={40} color={'white'} style={styles.logo}/>
        <Text style={styles.logoText}>SimpleChat™</Text>
      </View>
      <View style={styles.infoView}>
      <Text style={styles.infoText}>Welcome to SimpleChat!</Text>
      <Text style={styles.infoText}>Click below to begin the registration process.</Text>
      <TouchableOpacity style={{backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginTop: 20, padding: 10, borderRadius: 20,}} onPress={goToNextStep}>
        <Text style={{fontSize: 20,}}>START REGISTRATION</Text>
      </TouchableOpacity>
      </View>
  </LinearGradient>
      )}

    {/* Step 2: Enter your name */}
    {step === 2 && (
      <View style={styles.mainView}>
        <Text style={styles.inputLabel}>My name is</Text>
        <TextInput
          style={[styles.textInput]}
          placeholder="Your Name"
          onChangeText={(text) => setName(text)}
          value={name}
          maxLength={20}
        />

        <View style={[styles.bottomButtonContainer, {bottom: 10 + keyboardOffset}]}>
          <TouchableOpacity style={[styles.bottomButton]} onPress={goToNextStep} disabled={name.length < 3}>
            <LinearGradient
              colors={name.length >= 3 ? ['#E4572E', '#DD5227', '#F05B2E'] : ['gray', 'gray']}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>CONTINUE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
    )}

      {/* Step 3: Enter your age */}
      {step === 3 && (
        <View style={styles.mainView}>
          <Text style={styles.inputLabel}>My age is</Text>
          <Picker
            selectedValue={age}
            onValueChange={(itemValue) => setAge(itemValue)}
            style={{width: 200, zIndex: 900,}}
          >
            {ageItems.map((item, index) => (
              <Picker.Item key={index} label={item.label} value={item.value} />
            ))}
          </Picker>
          <View style={[styles.bottomButtonContainer, {bottom: 10 + keyboardOffset}]}>
          <TouchableOpacity style={styles.bottomButton} onPress={goToNextStep}>
            <LinearGradient
              colors={['#E4572E', '#DD5227', '#F05B2E']}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>CONTINUE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
      )}

      {/* Step 4: Enter your sex */}
      {step === 4 && (
        <View style={styles.mainView}>
          <Text style={styles.inputLabel}>I am a</Text>
          <TouchableOpacity onPress={() => {
            setSex('Male')
          }}>
            <View style={[styles.sexButton, sex === 'Male' && {borderWidth: 3, borderColor: '#E4572E'}]}><Text style={[{opacity: 0.5,}, sex === 'Male' && {color: '#E4572E', opacity: 1}]}>Man</Text></View>
            </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setSex('Female')
          }}> 
          <View style={[styles.sexButton, sex === 'Female' && {borderWidth: 3, borderColor: '#E4572E'}]}><Text style={[{opacity: 0.5,}, sex === 'Female' && {color: '#E4572E', opacity: 1}]}>Woman</Text></View>
          </TouchableOpacity>
          <View style={[styles.bottomButtonContainer, {bottom: 10 + keyboardOffset}]}>
          <TouchableOpacity style={styles.bottomButton} onPress={goToNextStep} disabled={sex === ''}>
            <LinearGradient
              colors={sex !== '' ? ['#E4572E', '#DD5227', '#F05B2E'] : ['gray', 'gray']}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>CONTINUE</Text>
            </LinearGradient>
          </TouchableOpacity>
          </View>
        </View>
      )}
      {step === 5 && (
        <View style={styles.mainView}>
          <Text style={styles.inputLabel}>My country is</Text>
          <Picker
            selectedValue={country}
            onValueChange={(itemValue) => setCountry(itemValue)}
            style={{width: '100%', zIndex: 900}}

          >
            {countryList.map((item, index) => (
              <Picker.Item key={index} label={item.label} value={item.value} />
            ))}
          </Picker>
          <View style={[styles.bottomButtonContainer, {bottom: 10 + keyboardOffset}]}>
          <TouchableOpacity style={styles.bottomButton} onPress={handleRegister} disabled={isButtonDisabled}>
            <LinearGradient
              colors={['#E4572E', '#DD5227', '#F05B2E']}
              style={styles.gradient}
            >
              <Text style={styles.buttonText}>REGISTER</Text>
            </LinearGradient>
          </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sexButton: {
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'gray',
  },
  warning: {
    color: 'red',
  },
  infoView: {
    position: 'absolute',
    bottom: 140,
  },
  infoText: {
    color: 'white',
    textAlign: 'center'
  },
  logo: {
    margin: 10,

  },
  logoText: {
    color: 'white',
    fontSize: 35,
    marginTop: -5
  },
  mainView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%'
  },
  inputLabel: {
    position: 'absolute',
    top: 100,
    left: 40,
    opacity: 0.5,
    fontSize: 40,
    fontWeight: 'bold'
  },
  textInput: {
    borderBottomWidth: 0.5,
    borderColor: 'grey',
    padding: 4,
    margin: 10,
    width: 250,
    marginTop: -100
  },
  bottomButtonContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 50,
    alignItems: 'center',
    padding: 10,
  },
  bottomButton: {
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    height: 50,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 20,
    color: 'white',
  },
});

export default RegisterScreen;