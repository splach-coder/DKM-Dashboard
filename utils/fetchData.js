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

async function updateRecord(ID, handler) {
  try {
    const apiKey = process.env.FUNCTION_KEY;
    const apiUrl = `https://functionapp-python-pdf.azurewebsites.net/api/dashboard?code=${apiKey}`;

    const data = {
      ID,
      handler
    };

    const response = await axios.patch(apiUrl, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating record:", error);
    return null;
  }
}

module.exports = { fetchUserData, updateRecord }