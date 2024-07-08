import axios from "axios";
import config from "../config";

export const requestAdminAccess = async (password, authToken, id, navigation) => {
    // console.log("CALLING ADMIN ACCESS")
    
    try {
        // Include authToken, userData.id, and password in the URL as query parameters
        const response = await axios.get(`${config.BASE_URL}/1admin1/request-admin-access?userId=${id}&password=${password}`, {
            headers: {
                Authorization: authToken
            }
        });

        if (response.status === 200) {
            navigation.navigate('Admin')
        } else {
            alert("UNAUTHORIZED ACCESS");
            navigation.navigate('Register')
        }
    } catch (e) {
    }
}
