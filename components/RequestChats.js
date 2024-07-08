import axios from "axios";
import config from "../config";

export const requestChats = async (authToken, category, offset = 0) => {
    try {
        const response = await axios.get(`${config.BASE_URL}/serve-chats`, {
            headers: {
                Authorization: authToken
            },
            params: {
                category: category,
                offset: offset
            }
        });
        const chats = response.data.chats;
        return chats;
    } catch(error) {
        // console.error('Error fetching chats:', error);
        return null;
    }
};
