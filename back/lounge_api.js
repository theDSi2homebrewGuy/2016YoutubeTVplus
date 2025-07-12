const axios = require('axios');


async function getLoungeTokenBatch(screenIds) {
    try {

        const url = `https://www.youtube.com/api/lounge/pairing/get_lounge_token_batch?screen_ids=${screenIds}`;


        const response = await axios.get(url);


        if (response.data && response.data.screens) {
            response.data.screens.forEach(screen => {
                if (screen.screenId === screenIds) {
                    console.log('Found lounge token:', screen.loungeToken);
                }
            });
        }

        return response.data; 
    } catch (error) {
        console.error('Error getting lounge token batch:', error.message);
        throw error;
    }
}



async function generateScreenId(pairingCode) {
    try {
        const response = await axios.post('https://www.youtube.com/api/lounge/pairing/register_pairing_code', {
            pairing_code: pairingCode
        });
        return response.data;
    } catch (error) {
        console.error('Error generating screen ID:', error.message);
        throw error;
    }
}


async function getPairingCode(screenId) {
    try {
        const response = await axios.get(`https://www.youtube.com/api/lounge/pairing/get_pairing_code`, {
            params: { screen_id: screenId }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting pairing code:', error.message);
        throw error;
    }
}


async function registerPairingCode(pairingCode) {
    try {
        const response = await axios.post('https://www.youtube.com/api/lounge/pairing/register_pairing_code', {
            pairing_code: pairingCode
        });
        return response.data;
    } catch (error) {
        console.error('Error registering pairing code:', error.message);
        throw error;
    }
}

// Function to fetch lounge details
async function getLoungeDetails(screenId) {
    try {
        const response = await axios.get(`https://www.youtube.com/api/lounge/pairing/get_lounge_details`, {
            params: { screen_id: screenId }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching lounge details:', error.message);
        throw error;
    }
}

module.exports = {
    getLoungeTokenBatch,
    generateScreenId,
    getPairingCode,
    registerPairingCode,
    getLoungeDetails
};
