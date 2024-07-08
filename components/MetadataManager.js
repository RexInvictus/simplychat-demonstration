import AsyncStorage from "@react-native-async-storage/async-storage";

const METADATA_KEY = 'image_metadata';

export const getMetadata = async () => {
    const rawMetadata = await AsyncStorage.getItem(METADATA_KEY);
    return rawMetadata ? JSON.parse(rawMetadata) : {};
};

export const setMetadata = async (newMetadata) => {
    await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(newMetadata));
};


export const updateImageMetadata = async (userId, imageUrl, calledFrom) => {
    const metadata = await getMetadata();

    if (!(userId in metadata)) {
        metadata[userId] = { imageUrl: '', imageVersion: 0 };
    }
    metadata[userId].imageUrl = imageUrl;
    metadata[userId].imageVersion = (metadata[userId].imageVersion || 0) + 1

    await setMetadata(metadata);
};

// compares the stored url with the one retrieved from API to see if cache is invalid
export const isCacheInvalid = async (userId, imageUrl) => {
    // get the metadata to compare
    const metadata = await getMetadata();

    // if there is no metadata for this user, the cache is invalid and we must add it
    if (!(userId in metadata)) {
        await updateImageMetadata(userId, imageUrl, "isCacheINvalid");
        return true;
    }

    // if metadata exists for the user, compare it with the imageurl
    try {
        const currentUrl = metadata[userId]['imageUrl'];
        // if imageurl is different, need to force update
        if (imageUrl !== currentUrl) {
            return true;
        } else { // else no need for update
            return false;
        }
    } catch (e) {
    }
};