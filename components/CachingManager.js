import * as FileSystem from 'expo-file-system';


export const downloadImage = async (uri, fileURI) => {
    if (!uri || !fileURI) {
      // console.error("URI or FileURI is null");
      return;
    }
  
    try {
      // Delete existing file (if any)
      const fileInfo = await FileSystem.getInfoAsync(fileURI);
      if (fileInfo.exists) {
        try {
        await FileSystem.deleteAsync(fileURI);
        } catch (e) {
          // console.error("error caught", e)
        }
      }
  
      const { uri: downloadedUri } = await FileSystem.downloadAsync(uri, fileURI);
  
  
      return downloadedUri;
    } catch (e) {
      // console.error("Download failed:", e);
    }
  };
  


export const deleteImage = async (fileURI) => {
    try {
    await FileSystem.deleteAsync(fileURI, { idempotent: true });
    } catch (e) {
        // console.error(e);
    }
}

export const getInfo = async (fileURI) => {
    const metadata = await FileSystem.getInfoAsync(fileURI);
    return metadata;
}