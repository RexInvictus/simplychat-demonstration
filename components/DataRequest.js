import axios from 'axios';
import config from '../config';

export const requestInformation = async (authToken) => {

    try {
    const response = await axios.get(`${config.BASE_URL}/serve-user-data`, {
      headers: {
        Authorization: authToken,
      },
    });
    // console.log("REPONSE DATA IS", response.data)
    return response.data;

    } catch(error) {
      // console.error('Error:', error);
      throw error
    }
  };
