import React, { useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import PropTypes from 'prop-types';
import { updateImageMetadata, isCacheInvalid, getMetadata } from './MetadataManager';
import { downloadImage } from './CachingManager';

const CachedImage = props => {
  const { source: { uri }, cacheKey, forceUpdate, localUri, userId, message, setImageIsLoaded, test } = props;
  const filesystemURI = `${FileSystem.cacheDirectory}${cacheKey}`;
  const [imgURI, setImgURI] = useState(filesystemURI);
  const [version, setVersion] = useState(0);


  useEffect(() => {
    if (forceUpdate && localUri) {
      setImgURI(localUri);
    }
    if (userId === undefined) {
      setImgURI(uri);
    }
  }, [forceUpdate, localUri, userId]);
  // this useEffect determines what uri we should use.
  // there are three options: localuri (if user just changed their pfp and we are waiting for it to be updated), remote uri (if for some reason there is an error with caching), or cache uri.
  const downloadImageAndSetURI = async (uri, filesystemURI) => {
    setImgURI(uri);
    // console.log("downloading")
    await downloadImage(uri, filesystemURI);
    setImgURI(filesystemURI);
  };

  useEffect(() => {
    const loadImage = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(filesystemURI);

        if (message) {
          if (fileInfo.exists) {
          // If the file exists and message is true, return early
          return;
          } else {
            // console.log("Downloading message", filesystemURI);
            await downloadImageAndSetURI(uri, filesystemURI);
            return;
          }
        }
        

  

        const cacheInvalid = await isCacheInvalid(userId, uri);
  
        if (fileInfo.exists && !cacheInvalid) {
          return;
        }
  
        if (forceUpdate && uri) {
          // // console.log("forcing update")
          // If forceUpdate is true and localUri exists
          await updateImageMetadata(userId, uri, "CachedImage");
          await downloadImageAndSetURI(uri, filesystemURI);
          return;
        }
        // If cache is invalid or the file doesn't exist
        await downloadImageAndSetURI(uri, filesystemURI);
        await updateImageMetadata(userId, uri);
  
      } catch (error) {
        // console.error("Error loading image:", error);
      }
    };
    
    const executeFunctions = async () => {
      try {
      await loadImage();
      } catch {
        setImgURI(uri);
      }
  };

    executeFunctions();
  }, [uri]);
  
  
  
  

  useEffect( () => {
    if (!message & Platform.OS === 'android') {
    try {
    const getImageVersion = async () => {
      const metadata = await getMetadata();
      setVersion(metadata[userId].imageVersion);
    };
    getImageVersion();
   
    } catch (e) {
      // console.error(e)
    }
  }
    
  }, [imgURI])

  return (
    <Image
      {...props}
      key={uri}
      source={{ uri: Platform.OS === 'ios' ? imgURI : imgURI + '?v=' + version + 139 }}
      onLoad={() => { 
        if (setImageIsLoaded) {
        setImageIsLoaded(true); }}}
      onError={(e) => { 
        if (setImageIsLoaded) {
        setImageIsLoaded(false);}
        // console.log("detected error")
        setImgURI(uri);
       }}
    />
  );
  
};

CachedImage.propTypes = {
  source: PropTypes.object.isRequired,
  cacheKey: PropTypes.string.isRequired,
  forceUpdate: PropTypes.bool,
}

export default React.memo(CachedImage);