const fs = require('fs');
const path = require('path');

async function fetchGuideData() {
    const filePath = path.join(__dirname, '..', 'assets', 'guide_json.json');

    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        let guideData = JSON.parse(rawData);

        console.log('Raw response data:', JSON.stringify(guideData, null, 2));

        return guideData;
    } catch (error) {
        console.error('Error reading or processing guide data:', error.message);
        throw new Error('Failed to read or process the guide data.');
    }
}

module.exports = { fetchGuideData };
