const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const QRCode = require('qrcode');
const corsAnywhere = require('cors-anywhere');

const { fetchGuideData } = require('./guide_api');

const { handleSearchRequest } = require('./search_api');
const { fetchNextData } = require('./next_api');
const { handleGetVideoInfo } = require('./get_video_info');

// may or may not be used I am just keeping it
const { fetchLoungeTokenBatch } = require('./lounge_api');

const bodyParser = require('body-parser');
const oauthRouter = require('./oauth_api_v3_api.js');

const watchPageInteractions = require('./watch_page_interactions_apis');


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
    console.log(`Current settings in settings.json: ${JSON.stringify(settings, null, 4)}`);
}

const { fetchBrowseData } = settings.expBrowse
    ? require('./exp_browse_api')  
    : require('./browse_api');    

const serverIp = settings.serverIp || "localhost";

console.log("Loaded Server IP:", serverIp);

const app = express();
const port = 8090;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'credentialless');
    next();
});

const server = corsAnywhere.createServer({
    originWhitelist: [`http://${serverIp}:8090`, '*', '""', '', 'null', "null"],
    removeHeaders: ['cookie', 'cookie2'],
    handleInitialRequest: (req, res) => {
        const origin = req.headers.origin;

        if (origin === `http://${serverIp}:8090` || origin === '*') {
            res.setHeader('Access-Control-Allow-Origin', origin);
        } else {
            res.setHeader('Access-Control-Allow-Origin', '*');
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return true;
        }
        return false;
    }
});


server.listen(8070, serverIp, () => {
    console.log('CORS Anywhere proxy running on http://' + serverIp + ':8070');
});


app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.originalUrl}`);
    next();
});

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

app.use(express.json());


app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.use('/logs', express.static(path.join(__dirname, '../logs')));


app.get('/', (req, res) => {
    console.log('Received request for the root endpoint');
    res.sendFile(path.join(__dirname, '../index.html'));
});

oauthRouter(app);
watchPageInteractions(app);

app.get('/get-thumbnail', async (req, res) => {
    const videoId = req.query.videoId;

    if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required.' });
    }

    const youtubeThumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    try {
        res.json({ thumbnailUrl: youtubeThumbnailUrl });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch thumbnail.' });
    }
});


app.get('/web/*', (req, res) => {
    const requestedUrl = req.params[0];

    const urlStartIndex = requestedUrl.indexOf('http');
    const youtubeUrl = requestedUrl.substring(urlStartIndex);
    const fileName = path.basename(youtubeUrl);

    console.log(`Redirecting to asset: /assets/${fileName}`);

    return res.redirect(`/assets/${fileName}`);
});

app.get('/assets/:folder/*', (req, res) => {
    const folder = req.params.folder;
    const requestedPath = req.params[0];

    const fileName = path.basename(requestedPath);

    const redirectUrl = `/assets/${fileName}`;
    console.log(`Redirecting from /assets/${folder}/${requestedPath} to ${redirectUrl}`);

    res.redirect(redirectUrl);
});

app.get('/assets/:filename', (req, res) => {
    const filename = req.params.filename;

    const cleanedFilename = filename.replace(/^[a-f0-9]{8}/, '');

    console.log(`Serving file: /assets/${cleanedFilename}`);

    const filePath = path.join(__dirname, '../assets', cleanedFilename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).send('File not found');
        }

        res.sendFile(filePath);
    });
});

app.get('/gen_204', async (req, res) => {
    try {
        const youtubeUrl = 'https://www.youtube-nocookie.com/gen_204?app_anon_id=a8d9033a-9d84-4178-a37f-8bf49003bc66&firstactive=1456804800&prevactive=1456804800&firstactivegeo=US&loginstate=0&firstlogin=0&prevlogin=0&c=TVHTML5&cver=5.20150715&ctheme=CLASSIC&label=c96c1c11';

        const response = await axios.get(youtubeUrl);

        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Error forwarding request to YouTube:', error);
        res.status(200).json({ status: 'Failed to fetch data from YouTube' });
    }
});

app.get(/^\/{0,2}get_video_info$/, (req, res) => {
    handleGetVideoInfo(req, res);
});

app.get('/device_204', async (req, res) => {
    try {
        const youtubeUrl = 'https://www.youtube-nocookie.com/device_204?app_anon_id=a8d9033a-9d84-4178-a37f-8bf49003bc66&firstactive=1456804800&prevactive=1456804800&firstactivegeo=US&loginstate=0&firstlogin=0&prevlogin=0&c=TVHTML5&cver=5.20150715&ctheme=CLASSIC&label=c96c1c11';

        const response = await axios.get(youtubeUrl);

        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Error forwarding request to YouTube:', error);
        res.status(200).json({ status: 'Failed to fetch data from YouTube' });
    }
});


app.get('/api/stats/qoe', (req, res) => {
    const qoeData = req.query;
    console.log('QoE Data received:', qoeData);

    const { event, fmt, afmt, cpn, ei, el, docid, ns, fexp, html5, c, cver, cplayer, cbrand, cbr, cbrver, ctheme, cmodel, cnetwork, cos, cosver, cplatform, vps, cmt, afs, vfs, view, bwe, bh, vis } = qoeData;

    if (!event || !fmt || !afmt || !cpn || !ei || !docid || !ns) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const logEntry = `
    Event: ${event}, Format: ${fmt}, Audio Format: ${afmt}, CPN: ${cpn}, EI: ${ei}, EL: ${el}, DocID: ${docid}, 
    NS: ${ns}, Exp: ${fexp}, HTML5: ${html5}, C: ${c}, CVer: ${cver}, CPlayer: ${cplayer}, CBrand: ${cbrand}, 
    CBR: ${cbr}, CBRVer: ${cbrver}, CTheme: ${ctheme}, CModel: ${cmodel}, CNetwork: ${cnetwork}, COS: ${cos}, 
    COSVer: ${cosver}, CPlatform: ${cplatform}, VPS: ${vps}, CMT: ${cmt}, AFS: ${afs}, VFS: ${vfs}, View: ${view}, 
    BWE: ${bwe}, BH: ${bh}, VIS: ${vis}, Timestamp: ${new Date().toISOString()}
    \n`;

    const logFilePath = path.join(logsDir, 'qoe_report.txt');

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
            return res.status(500).json({ error: 'Failed to log data' });
        }

        res.status(200).json({
            message: 'QoE data received and logged successfully',
            data: qoeData
        });
    });
});

app.get('/api/chart', async (req, res) => {
    const { cht, chs, chl } = req.query;

    if (!cht || cht !== 'qr' || !chl || !chs) {
        return res.status(400).send('Invalid request. Parameters "cht", "chs", and "chl" are required.');
    }

    const size = chs.split('x');
    if (size.length !== 2 || isNaN(size[0]) || isNaN(size[1])) {
        return res.status(400).send('Invalid "chs" parameter. Expected format "widthxheight".');
    }

    const width = parseInt(size[0]);
    const height = parseInt(size[1]);

    try {
        const decodedUrl = decodeURIComponent(chl);

        const qrImage = await QRCode.toBuffer(decodedUrl, { width, height });

        res.setHeader('Content-Type', 'image/png');
        res.send(qrImage);
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).send('Failed to generate QR code');
    }
});

app.get('/api/browse', async (req, res) => {
    const { browseId } = req.query;

    if (!browseId) {
        return res.status(400).json({
            error: 'Missing browseId parameter in the request.'
        });
    }

    try {
        const browseData = await fetchBrowseData(browseId);
        res.json(browseData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: error.message
        });
    }
});

app.post('/api/lounge/pairing/generate_screen_id', async (req, res) => {
    const { pairingCode } = req.body;

    if (!pairingCode) {
        return res.status(400).json({
            error: 'Missing pairingCode parameter in the request.'
        });
    }

    try {
        const screenIdData = await generateScreenId(pairingCode);
        res.json(screenIdData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to generate screen ID',
            details: error.message
        });
    }
});


app.post('/api/lounge/pairing/get_lounge_token_batch', async (req, res) => {
    const { screenIds } = req.body;

    if (!screenIds) {
        return res.status(400).json({
            error: 'Missing screenIds parameter in the request.'
        });
    }

    try {
        // Call the helper function with the screenIds
        const tokenBatchData = await getLoungeTokenBatch(screenIds);
        res.json(tokenBatchData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to get lounge token batch',
            details: error.message
        });
    }
});

app.get('/api/lounge/pairing/get_pairing_code', async (req, res) => {
    const { screenId } = req.query;

    if (!screenId) {
        return res.status(400).json({
            error: 'Missing screenId parameter in the request.'
        });
    }

    try {
        const pairingCodeData = await getPairingCode(screenId);
        res.json(pairingCodeData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to get pairing code',
            details: error.message
        });
    }
});


app.post('/api/lounge/pairing/register_pairing_code', async (req, res) => {
    const { pairingCode } = req.body;

    if (!pairingCode) {
        return res.status(400).json({
            error: 'Missing pairingCode parameter in the request.'
        });
    }

    try {
        const registrationData = await registerPairingCode(pairingCode);
        res.json(registrationData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to register pairing code',
            details: error.message
        });
    }
});

app.get('/api/lounge/pairing/get_lounge_details', async (req, res) => {
    const { screenId } = req.query;

    if (!screenId) {
        return res.status(400).json({
            error: 'Missing screenId parameter in the request.'
        });
    }

    try {
        const loungeDetailsData = await getLoungeDetails(screenId);
        res.json(loungeDetailsData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to get lounge details',
            details: error.message
        });
    }
});

app.all('/api/lounge/bc/bind', async (req, res) => {
    try {
        const youtubeApiUrl = 'https://www.youtube.com/api/lounge/bc/bind';
        
        // Extract necessary parameters from the request
        const loungeIdToken = req.query.loungeIdToken;
        const device = req.query.device || 'LOUNGE_SCREEN';
        
        if (!loungeIdToken) {
            return res.status(400).json({ error: 'Missing loungeIdToken' });
        }
        
        // Construct the correct request to YouTube API
        const params = new URLSearchParams({
            device,
            id: 'deff2a47-89f4-4d02-a940-c00d0abf2809',
            obfuscatedGaiaId: '',
            name: 'YouTube on TV',
            app: 'lb-v4',
            theme: 'cl',
            capabilities: 'dsp,mic,dpa,ntb,pas,dcn,dcp,drq,isg,els',
            cst: 'm',
            mdxVersion: '2',
            loungeIdToken,
            VER: '8',
            v: '2',
            deviceInfo: JSON.stringify({
                brand: 'Samsung',
                model: 'SmartTV',
                year: 0,
                os: 'Tizen',
                osVersion: '5.0',
                chipset: '',
                clientName: 'TVHTML5',
                dialAdditionalDataSupportLevel: 'unsupported',
                mdxDialServerType: 'MDX_DIAL_SERVER_TYPE_UNKNOWN',
                hasIdentityDifferentFromCurrent: false,
                switchableIdentitiesSuffix: ''
            }),
            RID: '9551',
            CVER: '1',
            zx: Date.now().toString(),
            t: '1'
        });
        
        const apiUrlWithQuery = `${youtubeApiUrl}?${params.toString()}`;
        console.log(`Forwarding request to YouTube API: ${apiUrlWithQuery}`);
        
        // Forward request
        const response = await axios.post(apiUrlWithQuery, req.body, {
            headers: {
                ...req.headers,
                Host: 'www.youtube.com',
            }
        });
        
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Error forwarding request:', error.message);
        res.status(500).json({
            error: 'Failed to communicate with YouTube Lounge API',
            details: error.message,
        });
    }
});



app.post('/api/browse', async (req, res) => {
    const { browseId } = req.body;

    const authHeader = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;

    console.log('Authorization Header:', authHeader);

    if (!browseId) {
        return res.status(400).json({
            error: 'Missing browseId parameter in the request body.'
        });
    }

    try {
        const browseData = await fetchBrowseData(browseId, authHeader);

        res.json(browseData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: error.message
        });
    }
});



async function handleGuideRequest(req, res) {
    console.log(`Received ${req.method} request for /api/guide`);


    const authHeader = req.headers['authorization'];
    const authToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    try {
        const guideData = await fetchGuideData(authToken);
        res.json(guideData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
}



app.get('/api/guide', handleGuideRequest);
app.post('/api/guide', handleGuideRequest);

app.post('/api/next', async (req, res) => {
    const { videoId } = req.body;

    if (typeof videoId !== 'string' || !videoId.trim()) {
        return res.status(400).json({
            error: '"videoId" is required and must be a non-empty string.'
        });
    }

    const authorizationHeader = req.headers['authorization'];
    const accessToken = authorizationHeader && authorizationHeader.startsWith('Bearer ') ? authorizationHeader.split(' ')[1] : null;

    try {
        const nextData = await fetchNextData(videoId, accessToken);

        res.json(nextData);
    } catch (error) {
        console.error('Error fetching next data:', error.message);

        res.status(500).json({
            error: 'Failed to fetch data from YouTube /next API.',
            details: error.message || 'No additional details available.'
        });
    }
});



app.post('/api/search', handleSearchRequest);


app.listen(port, serverIp, () => {
    console.log(`Server running at http://` + serverIp + `:` + port);
});
