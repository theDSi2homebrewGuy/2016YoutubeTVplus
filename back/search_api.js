const axios = require('axios');
const fs = require('fs');
const path = require('path');

function addVideoRendererToEachItem(data) {
    if (data && data.contents && data.contents.sectionListRenderer) {
        const sections = data.contents.sectionListRenderer.contents;

        sections.forEach(section => {
            if (section.shelfRenderer && section.shelfRenderer.content && section.shelfRenderer.content.horizontalListRenderer) {
                // Filter out ads
                section.shelfRenderer.content.horizontalListRenderer.items = section.shelfRenderer.content.horizontalListRenderer.items.filter(item => {
                    return !item.hasOwnProperty('adSlotRenderer');
                });

                // Process each item
                section.shelfRenderer.content.horizontalListRenderer.items.forEach((item, index, items) => {
                    if (item.tileRenderer) {
                        const videoRenderer = generateVideoRenderer(item.tileRenderer);

                        // Sanity check for videoRenderer
                        if (validateVideoRenderer(videoRenderer)) {
                            item.videoRenderer = videoRenderer;
                        } else {
                            console.warn(`Item at index ${index} failed sanity check and will be removed.`);
                            items[index] = null; // Mark for removal
                        }

                        delete item.tileRenderer;
                    }
                });

                // Remove invalid items
                section.shelfRenderer.content.horizontalListRenderer.items = section.shelfRenderer.content.horizontalListRenderer.items.filter(item => item !== null);
            }
        });
    }
    return data;
}

function validateVideoRenderer(videoRenderer) {
    if (!videoRenderer) {
        return false;
    }

    const requiredFields = [
        'title',
        'description',
        'shortBylineText',
        'browseId',
        'views',
        'publishedTime',
        'lengthText',
        'videoId',
        'navigationEndpoint'
    ];

    for (const field of requiredFields) {
        if (!videoRenderer[field] || videoRenderer[field] === 'Unknown' || videoRenderer[field] === '0 views' || videoRenderer[field] === 'Unknown time') {
            console.warn(`Missing or invalid field: ${field} in videoRenderer`, videoRenderer);
            return false;
        }
    }

    return true;
}

function generateVideoRenderer(tileRenderer) {
    const title = extractTitle(tileRenderer);
    const description = extractDescription(tileRenderer);
    const shortBylineText = extractChannel(tileRenderer);
    const browseId = extractBrowseID(tileRenderer);
    const views = extractViews(tileRenderer);
    const publishedTime = extractPublishedTime(tileRenderer);
    const videoId = extractVideoId(tileRenderer);
    const lengthText = extractLength(tileRenderer);
    const navigationEndpoint = extractNavigationEndpoint(tileRenderer);

    if (!shortBylineText || shortBylineText.name === 'Unknown Channel' || !views || views === '0 views' || !publishedTime || publishedTime === 'Unknown time') {
        console.log("Video excluded due to missing or unknown channel, views, or published time.");
        return null;
    }

    return {
        title,
        description,
        shortBylineText,
        browseId,
        views,
        publishedTime,
        lengthText,
        videoId,
        navigationEndpoint
    };
}

function extractLength(tileRenderer) {
    const thumbnailOverlays = tileRenderer?.header?.tileHeaderRenderer?.thumbnailOverlays || [];
    const lengthOverlay = thumbnailOverlays.find(overlay =>
        overlay.thumbnailOverlayTimeStatusRenderer && overlay.thumbnailOverlayTimeStatusRenderer.text
    );

    if (lengthOverlay && lengthOverlay.thumbnailOverlayTimeStatusRenderer.text) {
        const lengthText = lengthOverlay.thumbnailOverlayTimeStatusRenderer.text.simpleText || 'Unknown length';
        console.log("Extracted length:", lengthText);
        return lengthText;
    }

    return 'Unknown length';
}

function extractTitle(tileRenderer) {
    const metadata = tileRenderer.metadata || {};
    const title = metadata.tileMetadataRenderer && metadata.tileMetadataRenderer.title
        ? metadata.tileMetadataRenderer.title.simpleText
        : 'Unknown Title';

    console.log("Title:", title);
    return title;
}

function extractDescription(tileRenderer) {
    const metadata = tileRenderer.metadata || {};
    const description = metadata.tileMetadataRenderer && metadata.tileMetadataRenderer.description
        ? metadata.tileMetadataRenderer.description.simpleText
        : 'No description available';

    console.log("Description:", description);
    return description;
}

function extractNavigationEndpoint(tileRenderer) {
    if (tileRenderer.onSelectCommand && tileRenderer.onSelectCommand.watchEndpoint) {
        const watchEndpoint = tileRenderer.onSelectCommand.watchEndpoint;
        const navigationEndpoint = {
            clickTrackingParams: watchEndpoint.clickTrackingParams || '',
            watchEndpoint: {
                videoId: watchEndpoint.videoId || '',
                params: watchEndpoint.params || '',
                playerParams: watchEndpoint.playerParams || '',
                watchEndpointSupportedOnesieConfig: watchEndpoint.watchEndpointSupportedOnesieConfig || {}
            }
        };
        console.log("Extracted navigationEndpoint:", JSON.stringify(navigationEndpoint, null, 2));
        return navigationEndpoint;
    }
    console.log("Navigation endpoint not found.");
    return null;
}

function extractChannel(tileRenderer) {
    const channelMetadata = tileRenderer?.metadata?.tileMetadataRenderer?.lines?.[0]?.lineRenderer?.items?.[0]?.lineItemRenderer?.text?.runs?.[0]?.text || 'Unknown Channel';

    console.log("Channel:", channelMetadata);
    return {
        name: channelMetadata,
        id: '',
    };
}

function extractBrowseID(tileRenderer) {
    const browseId = tileRenderer?.onLongPressCommand?.showMenuCommand?.menu?.menuRenderer?.items?.find(item => item.menuNavigationItemRenderer?.navigationEndpoint?.browseEndpoint)?.menuNavigationItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId;
    console.log("Browse ID:", browseId || 'Unknown');
    return {
        browseId: browseId || 'Unknown',
    };
}

function extractViews(tileRenderer) {
    const metadata = tileRenderer.metadata || {};
    const lines = metadata.tileMetadataRenderer && metadata.tileMetadataRenderer.lines || [];

    console.log("Lines for Views:", lines);

    const timeLine = lines.find(line => {
        return line.lineRenderer && line.lineRenderer.items.some(item =>
            item.lineItemRenderer && item.lineItemRenderer.text && item.lineItemRenderer.text.simpleText && item.lineItemRenderer.text.simpleText.includes('ago')
        );
    });

    if (timeLine) {
        const timeText = timeLine.lineRenderer.items.find(item => {
            return item.lineItemRenderer && item.lineItemRenderer.text && item.lineItemRenderer.text.simpleText;
        });

        const time = timeText ? timeText.lineItemRenderer.text.simpleText : '0 Views';
        console.log("Views:", time);
        return time;
    }
    return '0 views';
}

function extractPublishedTime(tileRenderer) {
    const metadata = tileRenderer.metadata || {};
    const lines = metadata.tileMetadataRenderer && metadata.tileMetadataRenderer.lines || [];

    console.log("Lines for Time:", lines);

    if (lines.length > 1) {
        const secondLine = lines[1].lineRenderer.items;

        const timeItem = secondLine.find(item =>
            item.lineItemRenderer && item.lineItemRenderer.text && item.lineItemRenderer.text.simpleText && item.lineItemRenderer.text.simpleText.includes("ago")
        );

        const time = timeItem ? timeItem.lineItemRenderer.text.simpleText : 'Unknown time';
        console.log("Published Time:", time);
        return time;
    }

    return 'Unknown time';
}

function extractVideoId(tileRenderer) {
    if (tileRenderer.onSelectCommand && tileRenderer.onSelectCommand.watchEndpoint) {
        return tileRenderer.onSelectCommand.watchEndpoint.videoId || 'Unknown videoId';
    }
    return 'Unknown videoId';
}

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

async function handleSearchRequest(req, res) {
    const { query, context } = req.body;

    if (!query || !context) {
        return res.status(400).json({
            error: 'Missing query or context in the request body.',
            expectedFormat: 'POST JSON body: { "query": "<search_term>", "context": { ... } }'
        });
    }

    const apiKey = 'AIzaSyDCU8hByM-4DrUqRUYnGn-3llEO78bcxq8';
    const apiUrl = 'https://www.googleapis.com/youtubei/v1/search';

    const postData = {
        query,
        context: {
            client: {
                clientName: 'TVHTML5',
                clientVersion: '7.20250205.16.00',
                hl: 'en',
                gl: 'US',
            }
        }
    };

    const authToken = req.headers['authorization']?.split(' ')[1]; 

    const headers = {
        'Content-Type': 'application/json',
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await axios.post(apiUrl, postData, {
            headers,
            params: { key: apiKey }
        });

        console.log("Raw response data:", JSON.stringify(response.data, null, 2));

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logFilePath = path.join(logsDir, `response-${timestamp}.json`);
        fs.writeFileSync(logFilePath, JSON.stringify(response.data, null, 2));

        const processedResponse = addVideoRendererToEachItem(response.data);

        res.json(processedResponse);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch data from YouTube API.',
            details: error.message
        });
    }
}

module.exports = { handleSearchRequest };
