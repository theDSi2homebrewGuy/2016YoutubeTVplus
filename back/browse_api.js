const axios = require('axios'); 
const fs = require('fs'); 
const path = require('path'); 

const settingsPath = path.join(__dirname, 'settings.json');

let settings;

if (!fs.existsSync(settingsPath)) {
    const defaultSettings = { 
        serverIp: 'localhost',  
        expBrowse: false        
    };
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 4));
    console.log("Created settings.json with default serverIp = localhost and expBrowse = false.");
    settings = defaultSettings;
} else {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

const serverIp = settings.serverIp || "localhost";

async function fetchBrowseData() {
    try {
        const fileUrl = `http://${serverIp}:8090/assets/browse_example_client6.json`;
        const fileResponse = await axios.get(fileUrl);

        return fileResponse.data;
    } catch (error) {
        console.error('Error:', error.message);
        
        if (error.response) {
            console.error('Error Response:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('General error:', error.message);
        }
        
        return { error: 'Failed to read the JSON file' };
    }
}


module.exports = { fetchBrowseData };