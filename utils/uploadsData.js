const axios = require("axios");
const { log } = require("console");
const FormData = require("form-data");
const fs = require("fs");

async function fetchUploads(companyName) {
  try {
    const apiKey = process.env.FUNCTION_KEY2;
    const apiUrl = `https://functionapp-python-api-atfnhbf0b7c2b0ds.westeurope-01.azurewebsites.net/api/logs/${companyName}?code=${apiKey}`;

    const response = await axios.get(apiUrl);

    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

// 📨 Send report + files to Azure Function
async function sendReportToAzure(formDataObj, files) {
  try {
    const apiKey = process.env.FUNCTION_KEY2;
    const apiUrl = `https://functionapp-python-api-atfnhbf0b7c2b0ds.westeurope-01.azurewebsites.net/api/LogReportsApi?code=${apiKey}`;

    const form = new FormData();

    // append form fields
    for (const key in formDataObj) {
      form.append(key, formDataObj[key]);
    }

    // append file buffers correctly
    files.forEach((file) => {
      form.append("files", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    const response = await axios.post(apiUrl, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error) {
    console.error(
      "❌ Error sending report:",
      error.response?.data || error.message
    );
    throw error;
  }
}


module.exports = {
  fetchUploads,
  sendReportToAzure,
};
