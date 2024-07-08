import axios from "axios";
import config from "../config";


export const requestMessages = async (authToken, chatId, afterTimestamp = null) => {
  try {
    const params = { chat_id: chatId };
    if (afterTimestamp) {
      params.after_timestamp = afterTimestamp;
    }
    const response = await axios.get(`${config.BASE_URL}/getmessages`, {
      headers: {
        Authorization: authToken,
        "Content-Type": 'application/json'
      },
      params
    });

    if (response.status === 200) {
      const messageData = response.data.messages;
      // console.log("Message Data:", messageData);
      return messageData;
    } else {
      // console.error("Received a non-200 status code:", response.status);
      return [];
    }
  } catch (error) {
    // console.error("Error in requestMessages:", error);
    return [];
  }
};