import React from "react";
import { Image, View, ScrollView, Dimensions } from 'react-native';
import CachedImage from "../components/CachedImage";

const { width, height } = Dimensions.get('window');

const ImageScreen = ({ route }) => {
    const { imageUri, senderId, id, isOwnMessage } = route.params;
    
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
          <ScrollView
            contentContainerStyle={{ width, height }}
            maximumZoomScale={3}
            minimumZoomScale={1}
            centerContent={true}
          >
            <CachedImage
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '90%', resizeMode: 'contain' }}
              message={true}
              cacheKey={senderId + "id" + id}
              isOwnMessage={isOwnMessage}
            />
          </ScrollView>
      </View>
    );
};

export default ImageScreen;
