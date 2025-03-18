const axios = require("axios");

async function fetchUserData() {
  try {
    const apiKey = process.env.FUNCTION_KEY;;
    const apiUrl = `https://functionapp-python-pdf.azurewebsites.net/api/dashboard?code=${apiKey}`;

    const response = await axios.get(apiUrl);  

    return response.data;
    
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

module.exports = { fetchUserData }