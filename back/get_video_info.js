const fs = require('fs');
const path = require('path');
const { title } = require('process');
const youtubeDl = require('youtube-dl-exec');

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


function handleGetVideoInfo(req, res) {
    const videoId = req.query.video_id;
    const prettyPrint = req.query.prettyprint === 'true';
    const unurlencode = req.query.unurlencode === 'true';

    const disableWebM = false;
    if (!videoId) {
        return res.status(400).send('Video ID is required');
    }

    youtubeDl(videoId, {
        dumpSingleJson: true,
        noWarnings: true,
        quiet: true,
    })
        .then(output => {
            //console.log('Video Info:', output);

            const logsDir = path.join(__dirname, 'logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const logFilePath = path.join(logsDir, `video-info-${timestamp}.json`);

            fs.writeFileSync(logFilePath, JSON.stringify(output, null, 2));

            const videoIdFromOutput = output.id;
            const videoTitle = output.title;
            const videoDuration = output.duration;

            console.log('Video ID:', videoIdFromOutput);
            console.log('Video Title:', videoTitle);
            console.log('Video Duration:', videoDuration);

            const adaptiveFmts = [];
            const fmtListArr = [];
            const urlEncodedFmtStreamMapArr = [];

            if (output.formats && Array.isArray(output.formats)) {
                output.formats.forEach(format => {
                    const skipFormatIds = ["sb1", "sb2", "sb0"];
                    if (skipFormatIds.includes(format.format_id)) return;


                    if (disableWebM && (format.ext === 'webm' || format.acodec === 'vp9' || format.acodec === 'vp8')) return;

                    if (format.url && format.format_id) {
                        let mimeType;
                        if (format.vcodec && format.vcodec !== "none" && format.acodec && format.acodec !== "none") {
                            mimeType = `video/${format.ext || 'mp4'}; codecs="${format.vcodec},${format.acodec}"`;
                        } else if (format.vcodec && format.vcodec !== "none") {
                            mimeType = `video/${format.ext || 'mp4'}; codecs="${format.vcodec}"`;
                        } else if (format.acodec && format.acodec !== "none") {
                            mimeType = `audio/${format.ext || 'mp4'}; codecs="${format.acodec}"`;
                        } else {
                            mimeType = `application/octet-stream`;
                        }

                        if (format.format_id !== '18') {

                            if (format.url.includes('manifest')) {
                                console.log('Skipping manifest URL:', format.url);
                                return;
                            }

                            const urlParams = new URLSearchParams();
                            urlParams.append('url', format.url);
                            urlParams.append('itag', format.format_id);
                            urlParams.append('clen', format.filesize || 'unknown');
                            urlParams.append('lmt', format.lastModified || 'unknown');
                            urlParams.append('dur', format.duration || 'unknown');
                            urlParams.append('fps', format.fps || 'unknown');
                            urlParams.append('size', `${format.width || 0}x${format.height || 0}`);
                            urlParams.append('bitrate', format.tbr || 'unknown');
                            urlParams.append('type', mimeType);

                            adaptiveFmts.push(urlParams.toString());

                            const width = format.width || "unknown";
                            const height = format.height || "unknown";

                            if (width === "unknown" || height === "unknown") {
                                console.log('Skipping format with unknown width or height:', format);
                                return;
                            }

                            if (format.format_id) {
                                const fmtString = `${format.format_id}/${width}x${height}`;
                                fmtListArr.push(fmtString);
                            } else {
                                console.log('Skipping format with missing format_id:', format);
                            }
                        }

                        if (format.format_id === '18') {
                            const fmtString = `itag=${format.itag}&type=${mimeType}&url=${encodeURIComponent(format.url)}&quality=${format.quality || 'unknown'}`;
                            urlEncodedFmtStreamMapArr.push(fmtString);
                        }
                    } else {
                        console.log('Skipping format with missing URL or format_id:', format);
                    }
                });
            }

            if (adaptiveFmts.length === 0) {
                console.log('No adaptive formats found');
                return res.status(404).send('No adaptive formats found');
            }


            const fmtList = encodeURIComponent(fmtListArr.join(','));
            const adaptiveFmtsResponse = adaptiveFmts.join(',');
            const urlEncodedFmtStreamMapResponse = urlEncodedFmtStreamMapArr.join(',');
            //console.log('Constructed adaptive_fmts:', adaptiveFmtsResponse);
            //console.log('Constructed fmt_list:', fmtList);

            const videoInfo = `baseUrl=https%3A%2F%2F${encodeURIComponent(serverIp)}%3A8090
        iv_module=https%3A%2F%2Fs.ytimg.com%2Fyts%2Fswfbin%2Fplayer-vflq9bo_X%2Fiv_module.swf
        account_playback_token=QUFFLUhqbUNlSEVkMTBaWWVFcjgtNC1KZ3VIRzA0X2I2d3xBQ3Jtc0tsYklEbEFDemhBNlJJOS01TkFZQzJNUmVrVERqeDhaV1pqQmJEOFZ3V3pSWjNNRnhiZnd5NnJWejJONzM3dFh0MG9PT0U2Q3gzVnVKS194cEphNkVPeFE3azlSSFhabmh0QkpITW90b2FEMnpvVGZPQQ%3D%3D
        cbr=Chrome
        iv3_module=1
        iv_load_policy=1
        cosver=5.1
        probe_url=https%3A%2F%2Fr3---sn-p5qlsu7r.googlevideo.com%2Fvideogoodput%3Fid%3Do-AAdvekeNvhTnc7BLnVx3s1tYNVrOiCABO6a6dAvgVFLF%26source%3Dgoodput%26range%3D0-99999%26expire%3D1426349446%26ip%3D207.241.226.230%26ms%3Dpm%26mm%3D35%26pl%3D24%26sparams%3Did%2Csource%2Crange%2Cexpire%2Cip%2Cms%2Cmm%2Cpl%26signature%3D16006AFBAD95DD923171C54EAD9B46BC38E9EB.423F08645F93F89A254D8AF80FB0F006623DD7F3%26key%3Dcms1
        rvs=iurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FYxjyTznqNUY%252Fhqdefault.webp%26title%3D%25D7%2591%25D7%2595%25D7%2590%25D7%2595%2B%25D7%259C%25D7%25A8%25D7%2590%25D7%2595%25D7%25AA%2B%25D7%2590%25D7%25AA%2B%25D7%2597%25D7%25A0%25D7%2595%25D7%259A%2B%25D7%2593%25D7%2590%25D7%2595%25D7%259D%2B%25D7%25A2%25D7%2595%25D7%25A9%25D7%2594%2B%25D7%259E%25D7%259E%25D7%25A0%25D7%2599%2B%25D7%25A6%25D7%2597%25D7%2595%25D7%25A7%2B%252B%2B%25D7%25A9%25D7%2597%25D7%2596%25D7%2595%25D7%25A8%2B%25D7%25A9%25D7%259C%2B%25D7%25A7%25D7%25A8%25D7%2591%2B%25D7%259B%25D7%25A4%25D7%25A8%2B%25D7%259B%25D7%25A0%25D7%2590%26endscreen_autoplay_session_data%3Dplaynext%253D0%2526feature%253Drelated-auto%2526autonav%253D1%26id%3DYxjyTznqNUY%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D2101%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FYxjyTznqNUY%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252F_4RGlOLFSSU%252Fhqdefault.webp%26title%3D%25D7%2591%25D7%25A0%25D7%2598%2B%25D7%259C%25D7%25A0%25D7%2597%25D7%2595%25D7%259D%2B%25D7%2591%25D7%25A8%25D7%25A0%25D7%25A2%253A%2B%25D7%2590%25D7%2595%25D7%259C%25D7%2599%2B%25D7%2590%25D7%25AA%25D7%2594%2B%25D7%2594%25D7%25A7%25D7%2595%25D7%25A7%25D7%2595%253F%26id%3D_4RGlOLFSSU%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D667%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252F_4RGlOLFSSU%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FNi0mKluwQ_o%252Fhqdefault.webp%26title%3D%25D7%25A8%25D7%2599%25D7%25A0%25D7%2595%2B%25D7%25A6%25D7%25A8%25D7%2595%25D7%25A8%2B%25D7%259E%25D7%2595%25D7%25A8%25D7%2599%25D7%2593%2B%25D7%2590%25D7%25AA%2B%25D7%2599%25D7%25A0%25D7%2595%25D7%259F%2B%25D7%259E%25D7%2592%25D7%259C%2B%25D7%259E%25D7%25A9%25D7%2599%25D7%2593%25D7%2595%25D7%25A8%2B%25D7%2591%25D7%2592%25D7%259C%25D7%2599%2B%25D7%25A6%25D7%2594%2522%25D7%259C%26id%3DNi0mKluwQ_o%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D423%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FNi0mKluwQ_o%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FYwi1amZ29pg%252Fhqdefault.webp%26title%3D%25D7%2591%25D7%25A0%25D7%2598%2B%25D7%2591%25D7%25A2%25D7%25A8%25D7%2595%25D7%25A5%2B10%253A%2B%25D7%2594%25D7%25AA%25D7%25A7%25D7%25A9%25D7%2595%25D7%25A8%25D7%25AA%2B%25D7%259E%25D7%2595%25D7%25A4%25D7%25AA%25D7%25A2%25D7%25AA%2B%25D7%2591%25D7%259B%25D7%259C%2B%25D7%25A4%25D7%25A2%25D7%259D%2B%25D7%25A9%25D7%2594%25D7%25A2%25D7%259D%2B%25D7%2592%25D7%2595%25D7%25A0%25D7%2591%2B%25D7%2590%25D7%25AA%2B%25D7%2594%25D7%2591%25D7%2597%25D7%2599%25D7%25A8%25D7%2595%25D7%25AA%26id%3DYwi1amZ29pg%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D1075%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FYwi1amZ29pg%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FfslrzJcnrz4%252Fhqdefault.webp%26title%3D%25D7%2590%25D7%2599%25D7%2599%25D7%259C%25D7%25AA%2B%25D7%25A9%25D7%25A7%25D7%2593%2B%25D7%2591%25D7%25A2%25D7%2599%25D7%259E%25D7%2595%25D7%25AA%2B%25D7%25A1%25D7%2595%25D7%25A2%25D7%25A8%2B%25D7%259E%25D7%2595%25D7%259C%2B%25D7%2590%25D7%2597%25D7%259E%25D7%2593%2B%25D7%2598%25D7%2599%25D7%2591%25D7%2599%2B%25D7%2591%25D7%25A2%25D7%25A8%25D7%2595%25D7%25A5%2B2%26id%3DfslrzJcnrz4%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D418%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FfslrzJcnrz4%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FGMYp7vXBiEo%252Fhqdefault.webp%26title%3D%25D7%2594%25D7%2594%25D7%2599%25D7%25A4%25D7%25A1%25D7%2598%25D7%25A8%2B%25D7%2591%25D7%2598%25D7%2599%25D7%25A4%25D7%2595%25D7%259C%26id%3DGMYp7vXBiEo%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D205%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FGMYp7vXBiEo%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FbhJ9Za9VhNM%252Fhqdefault.webp%26title%3D%25D7%2591%25D7%25A0%25D7%2598%2B%25D7%2591%25D7%25A2%25D7%25A8%25D7%2595%25D7%25A5%2B2%253A%2B%2522%25D7%2590%25D7%25A0%25D7%2599%2B%25D7%25A0%25D7%2590%25D7%259C%25D7%25A5%2B%25D7%259C%25D7%2594%25D7%25A1%25D7%2591%25D7%2599%25D7%25A8%2B%25D7%259C%25D7%2597%25D7%2591%25D7%25A8%25D7%2599%2B%25D7%25A7%25D7%2595%25D7%25A0%25D7%2592%25D7%25A8%25D7%25A1%2B%25D7%259C%25D7%259E%25D7%2594%2B%25D7%2594%25D7%25A9%25D7%259E%25D7%2590%25D7%259C%2B%25D7%2594%25D7%2599%25D7%25A9%25D7%25A8%25D7%2590%25D7%259C%25D7%2599%2B%25D7%25AA%25D7%2595%25D7%25A7%25D7%25A3%2B%25D7%2590%25D7%2595%25D7%25AA%25D7%25A0%25D7%2595%2522%26id%3DbhJ9Za9VhNM%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D167%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FbhJ9Za9VhNM%252Fmqdefault.webp%2Cauthor%3Daviran15%26session_data%3Dfeature%253Dendscreen%26title%3D%25D7%2591%25D7%2595%25D7%2591%25D7%2594%2B%25D7%25A9%25D7%259C%2B%25D7%259E%25D7%2593%25D7%2599%25D7%25A0%25D7%2594%2B-%2B%25D7%259E%25D7%25A2%25D7%25A8%25D7%259B%25D7%2595%25D7%259F%2B%25D7%2590%25D7%2599%25D7%2599%25D7%259C%25D7%25AA%2B%25D7%25A9%25D7%25A7%25D7%2593%26length_seconds%3D98%26id%3Du7_1FOgPnQs%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252F_ihrEicKwOo%252Fhqdefault.webp%26title%3D%25D7%2594%25D7%2599%25D7%2592%2527%25D7%25A8%25D7%2594%2B%25D7%25A4%25D7%25A8%25D7%25A7%2B3%253A%2B%25D7%2594%25D7%25AA%25D7%25A1%25D7%259B%25D7%2595%25D7%259C%26id%3D_ihrEicKwOo%26author%3Dcapture_il%26length_seconds%3D1190%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252F_ihrEicKwOo%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FRYwEE7ZklCo%252Fhqdefault.webp%26title%3D%25D7%2594%25D7%2599%25D7%2592%2527%25D7%25A8%25D7%2594%2B%25D7%25A4%25D7%25A8%25D7%25A7%2B5%2B%25D7%2595%25D7%2590%25D7%2597%25D7%25A8%25D7%2595%25D7%259F%253A%2B%25D7%2594%25D7%25A4%25D7%25A6%25D7%25A6%25D7%2594%2B%25D7%2594%25D7%259E%25D7%25AA%25D7%25A7%25D7%25AA%25D7%25A7%25D7%25AA%26id%3DRYwEE7ZklCo%26author%3Dcapture_il%26length_seconds%3D986%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FRYwEE7ZklCo%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FVEvzFOMzgWM%252Fhqdefault.webp%26title%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2594%25D7%2594%25D7%2599%25D7%25A4%25D7%25A1%25D7%2598%25D7%25A8%2B-%2B%25D7%259E%25D7%25A4%25D7%25A1%25D7%2599%25D7%25A7%25D7%2599%25D7%259D%2B%25D7%259C%25D7%2594%25D7%25AA%25D7%25A0%25D7%25A6%25D7%259C%26id%3DVEvzFOMzgWM%26author%3DEli%2BSinger%26length_seconds%3D167%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FVEvzFOMzgWM%252Fmqdefault.webp%2Ciurlhq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FiPJk7UbHGlU%252Fhqdefault.webp%26title%3D%25D7%259E%25D7%25A0%25D7%25A9%25D7%25A7%25D7%2599%2B%25D7%2594%25D7%259E%25D7%2596%25D7%2595%25D7%2596%25D7%2595%25D7%25AA%2B%25D7%2594%25D7%2595%25D7%259C%25D7%259B%25D7%2599%25D7%259D%2B%25D7%259C%25D7%25A0%25D7%25A6%25D7%2597%26id%3DiPJk7UbHGlU%26author%3D%25D7%25A0%25D7%25A4%25D7%25AA%25D7%259C%25D7%2599%2B%25D7%2591%25D7%25A0%25D7%2598%2B%257C%2BNaftali%2BBennett%26length_seconds%3D141%26session_data%3Dfeature%253Dendscreen%26iurlmq_webp%3D%252F%252Fi.ytimg.com%252Fvi_webp%252FiPJk7UbHGlU%252Fmqdefault.webp
        of=DI8ulxjA44_i6rKc8TzAhw
        iv_invideo_url=https%3A%2F%2Fwww.youtube.com%2Fannotations_invideo%3Fcap_hist%3D1%26cta%3D2%26playlist_id%3DPLSH1V8Iv8_1VZzhTkvVHYdz8KUPeBGfN9%26video_id%3D0ggR11jYS3A
        length_seconds=${encodeURIComponent(videoDuration)}
        has_cc=False
        enablecsi=1
        pltype=contentugc
        dashmpd=https%3A%2F%2Fmanifest.googlevideo.com%2Fapi%2Fmanifest%2Fdash%2Frequiressl%2Fyes%2Fsparams%2Fas%252Cid%252Cip%252Cipbits%252Citag%252Cmm%252Cms%252Cmv%252Cpl%252Cplayback_host%252Crequiressl%252Csource%252Cexpire%2Fmm%2F31%2Fexpire%2F1426367447%2Fid%2Fo-ACX1zI2XgFa9Ua6DBBBDhejjcyuqZGGcBBuxoqx7yZEe%2Fipbits%2F0%2Ffexp%2F907263%252C927622%252C931372%252C933236%252C934954%252C937432%252C9405703%252C9406736%252C9407103%252C9407444%252C941440%252C943917%252C948124%252C951511%252C951703%252C952302%252C952612%252C952901%252C955301%252C957201%252C959701%252C963100%2Fupn%2FlzQl8NX90vo%2Fmt%2F1426345559%2Fsignature%2F83B28AA4F045410275E6A998720437E4349EF203.900B9BF39796F93CF795F626B9BD3FDD4B3723BA%2Fmv%2Fu%2Fip%2F207.241.226.230%2Fkey%2Fyt5%2Fitag%2F0%2Fpl%2F23%2Fsver%2F3%2Fplayback_host%2Fr10---sn-nwj7kned.googlevideo.com%2Fas%2Ffmp4_audio_clear%252Cwebm_audio_clear%252Cfmp4_sd_hd_clear%252Cwebm_sd_hd_clear%252Cwebm2_sd_hd_clear%2Fsource%2Fyoutube%2Fms%2Fau
        timestamp=1426345846
        avg_rating=4.5801980198
        vid=0ggR11jYS3A
        plid=AAURQQWJOzsm_uzM
        watermark=%2Chttps%3A%2F%2Fs.ytimg.com%2Fyts%2Fimg%2Fwatermark%2Fyoutube_watermark-vflHX6b6E.png%2Chttps%3A%2F%2Fs.ytimg.com%2Fyts%2Fimg%2Fwatermark%2Fyoutube_hd_watermark-vflAzLcD6.png
        ytfocEnabled=1
        video_id=${encodeURIComponent(videoId)}
        atc=a%3D3%26b%3DYLfP9dWvt5WXPMSq9vEpZTP_ePU%26c%3D1426345847%26d%3D1%26e%3D0ggR11jYS3A%26c3a%3D18%26hh%3DlThS1p2buueLl16Okg75F2RkKXM
        thumbnail_url=https%3A%2F%2Fi.ytimg.com%2Fvi%2F0ggR11jYS3A%2Fdefault.jpg
        iurlhq=https%3A%2F%2Fi.ytimg.com%2Fvi%2F0ggR11jYS3A%2Fhqdefault.jpg
        ldpj=0
        allow_embed=1
        iurlsd_webp=https%3A%2F%2Fi.ytimg.com%2Fvi_webp%2F0ggR11jYS3A%2Fsddefault.webp
        cos=Windows
        eventid=dk8EVYDiOemq-APyioDoDA
        allow_ratings=1
        iurlmq_webp=https%3A%2F%2Fi.ytimg.com%2Fvi_webp%2F0ggR11jYS3A%2Fmqdefault.webp
        watch_xlb=https%3A%2F%2Fs.ytimg.com%2Fyts%2Fxlbbin%2Fwatch-strings-iw_IL-vflTB6g9h.xlb
        iurlhq_webp=https%3A%2F%2Fi.ytimg.com%2Fvi_webp%2F0ggR11jYS3A%2Fhqdefault.webp
        muted=0
        c=web
        fexp=907263%2C927622%2C931372%2C933236%2C934954%2C937432%2C9405703%2C9406736%2C9407103%2C9407444%2C941440%2C943917%2C948124%2C951511%2C951703%2C952302%2C952612%2C952901%2C955301%2C957201%2C959701%2C963100
        status=ok
        iurlmaxres=https%3A%2F%2Fi.ytimg.com%2Fvi%2F0ggR11jYS3A%2Fmaxresdefault.jpg
        loudness=-20.4790000916
        fmt_list=${encodeURIComponent(fmtList)}
        aid=P-r-BXKOXj0
        ptk=youtube_none
        vq=auto
        iurl=https%3A%2F%2Fi.ytimg.com%2Fvi%2F0ggR11jYS3A%2Fhqdefault.jpg
        author=%D7%A0%D7%A4%D7%AA%D7%9C%D7%99+%D7%91%D7%A0%D7%98+%7C+Naftali+Bennett
        storyboard_spec=https://i.ytimg.com/sb/OxoOSohmaag/storyboard3_L0/default.jpg?sqp=-oaymwENSDfyq4qpAwVwAcABBqLzl_8DBgjvjc-oBg==&sigh=rs$AOn4CLCM4gaqvsBmP9olCrnqXWONsDTRCQ
        url_encoded_fmt_stream_map=${encodeURIComponent(adaptiveFmtsResponse)}
        adaptive_fmts=${encodeURIComponent(adaptiveFmtsResponse)}
        remarketing_url=https%3A%2F%2Fgoogleads.g.doubleclick.net%2Fpagead%2Fviewthroughconversion%2F962985656%2F%3Flabel%3Dfollowon_view%26cname%3D1%26foc_id%3D4x7LYSzgGH-TMKc9J8pwgQ%26backend%3Dplayer_vars%26cver%3DHTML5%26ptype%3Dno_rmkt%26aid%3DP989_XaxlmI
        idpj=-2
        cbrver=41.0.2272.89
        iurlsd=https%3A%2F%2Fi.ytimg.com%2Fvi%2F0ggR11jYS3A%2Fsddefault.jpg
        title=${encodeURIComponent(videoTitle)}
        iurlmaxres_webp=https%3A%2F%2Fi.ytimg.com%2Fvi_webp%2F0ggR11jYS3A%2Fmaxresdefault.webp
        csi_page_type=embed
        video_verticals=%5B16%2C+35%5D
        cl=88507848
        no_get_video_log=0
        iv_allow_in_place_switch=1
        iurl_webp=https%3A%2F%2Fi.ytimg.com%2Fvi_webp%2F0ggR11jYS3A%2Fhqdefault.webp
        uid=4x7LYSzgGH-TMKc9J8pwgQ
        view_count=71358
        iurlmq=https%3A%2F%2Fi.ytimg.com%2Fvi%2F0ggR11jYS3A%2Fmqdefault.jpg
        token=sSPRzi9D_lUlZc6YQ3eQUyy2ufFAoMasmxX1Ps4S1zA%3D
        tmi=1
        keywords=%D7%A0%D7%A4%D7%AA%D7%9C%D7%99+%D7%91%D7%A0%D7%98
        use_cipher_signature=False
        `;

            const properties = videoInfo.trim().split("\n");

            const encodedProperties = properties.map(prop => {
                const [key, value] = prop.split('=');
                const decodedValue = decodeURIComponent(value || '');
                return `${key}=${decodedValue !== value ? value : encodeURIComponent(value || '')}`;
            });

            const encodedResponse = encodedProperties.join('&').replace(/\s+/g, '');



            res.send(encodedResponse);
        })

        .catch(err => {
            console.error('Error fetching video info:', err);
            res.status(500).send('Failed to fetch video info');
        });
}

module.exports = { handleGetVideoInfo };
