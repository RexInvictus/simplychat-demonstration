import axios from "axios";
import config from "../config";

export const updateProfileDataRemotely = async (userData, authToken) => {
  try {
    // console.log("updating data...")
    const response = await axios.post(`${config.BASE_URL}/update-data`, userData, {
      headers: {
        Authorization: authToken
      }
    });
    return response;
  } catch (error) {
    // console.log(error);
    throw error;
  }
};
