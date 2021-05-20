const { FFmpeg, ffprobe, ffprobeSync } = require("kiss-ffmpeg");
const nodefetch = require("node-fetch");
const puppeteer = require("puppeteer");
const fsExtra = require('fs-extra')
const fsp = require('fs').promises;
const https = require('https');
const fs = require('fs');

fs.writeFileSync('./data/capture.xhr', "",{encoding:'utf8',flag:'w'});

function captureTraffic(videoURL) {

    if (!videoURL) {
        console.log("Video URL is missing");
        return;
    }

    (async() => {
        const browser = await puppeteer.launch({
            headless: false,
            product: 'brave',
            executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
        });


        const page = await browser.newPage();
        await page.setViewport({width: 1024, height: 768});
        if (fs.existsSync("./data/cookies.json")) {
            const cookiesString = await fsp.readFile('./data/cookies.json');
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
        } else {
            await page.goto('https://de.pornhubpremium.com/premium/login', {waitUntil: 'load', timeout: 0});
        
            await page.click("#username", {delay: 100});
            await page.type("#username", "asp3x", {delay: 100});
            await page.click("#password");
            await page.type("#password", "wN8t24TDvZ2T9bDKywc6", {delay: 100});
            await page.click('#submitLogin'); 
            await page.waitForNavigation(); 
    
            const cookies = await page.cookies();
            await fsp.writeFile('./data/cookies.json', JSON.stringify(cookies, null, 2));
        }

        await page.goto('https://de.pornhubpremium.com/view_video.php?viewkey=ph5fd2a09f83ad9', {waitUntil: 'load', timeout: 0});
        let videoTitle = await page.evaluate(() => {
            let videoWrap = document.getElementsByClassName("mgp_videoWrapper")[0].children;
            let videoTitleElement = document.getElementById("videoTitle").children[1];
            let videoTitle = videoTitleElement.innerHTML;
            let videoElem = videoWrap[0];
            let currentTime = videoElem.duration;           
            console.log(currentTime);
            videoElem.currentTime = currentTime;
            return videoTitle;
        });

        await page.click('.mgp_playPause');
        // await page.waitForNavigation({waitUntil: 'load', timeout: 0});

        await page.setRequestInterception(true);
        await page.on('request', (request) => {
            let reqContent = request.url();
            if (reqContent.includes("hls")) {
                let requestURL = request.url();

                let test = {"title": videoTitle, "url": requestURL};
                fs.writeFileSync('./data/capture.xhr', JSON.stringify(test));
            }
            request.continue();
        });
        setTimeout(function() { 
            // page.close();
            browser.close();
            downloadVideo();
        }, 15000);
    })();
}

async function downloadVideo() {
    cleanUP("downloads");
    let videoData = JSON.parse(fs.readFileSync("./data/capture.xhr"));
    const source = videoData["url"];
    let sourceArray = source.split("-");
    let segmentCount = Number(sourceArray[2]);
    sourceArray[2] = "${i}";
    let sourceArray2 = source.split(segmentCount);

    let maxCount = (( segmentCount + 1 ));
    for (let i = 1; i < maxCount; i++) {
        const content = await nodefetch(sourceArray2[0] + `${i}` + sourceArray2[1], {
            "headers": {
                "accept": "*/*",
                "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "sec-gpc": "1"
            },
            "referrer": "https://de.pornhubpremium.com/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors"
        });
    
        const file = fs.createWriteStream(`downloads/sec_${i}.ts`);
        const request = https.get(content.url, function(response) {
            response.pipe(file);
        });
        printProgress(i, maxCount);
    }
}

function cleanUP(directory) {
    fsExtra.emptyDirSync(directory);
    if (fs.existsSync("master.m3u8")) {
        fs.unlinkSync("master.m3u8");
    }
}

function printProgress(mix, max){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Downloaded ${mix} of ${max}`);
}

function convMP4() {
    let videoData = JSON.parse(fs.readFileSync("./data/capture.xhr"));
    const source = videoData["title"];
    ffmpeg = new FFmpeg({
        inputs: "downloads/master.m3u8",
        outputs:  { 
            url: source + ".mp4",
            options: { 
                "vcodec": "copy", 
                "c": "copy",
                "crf": "50"
            } 
        }
    });
    ffmpeg.run();
}

async function convM3u8() {
    const testFolder = './downloads/';
    fs.readdir(testFolder, (err, files) => {
        const fileCount = (( files.length ));
        console.log(fileCount);
        for (let i = 1; i < fileCount; i++) {
            
            console.log(`i[${i}] - f[${fileCount}]`);
            
    
            if (i == 1) {
                fs.appendFileSync('master.m3u8', '#EXTM3U\n');
                fs.appendFileSync('master.m3u8', '#EXT-X-TARGETDURATION:10\n');
                fs.appendFileSync('master.m3u8', '#EXT-X-MEDIA-SEQUENCE:1\n');
    
                fs.appendFileSync('master.m3u8', '#EXTINF:10, no desc\n');
                fs.appendFileSync('master.m3u8', `sec_${i}.ts\n`);
            } else if (i == (( fileCount - 1 ))){
                fs.appendFileSync('master.m3u8', '#EXT-X-ENDLIST');
            } else if (i < fileCount && i != 0) {
                fs.appendFileSync('master.m3u8', '#EXTINF:10, no desc\n');
                fs.appendFileSync('master.m3u8', `sec_${i}.ts\n`);
            } else {
                console.log("ERROR");
                // ffmpeg -i "conv/master.m3u8" -vcodec copy -c copy -crf 50 file.mp4
            }
        }
        fs.copyFile('master.m3u8', 'downloads/master.m3u8', (err) => {
            if (err) throw err;
            console.log('source.txt was copied to destination.txt');
            convMP4();
        });
    })
}


captureTraffic("https://de.pornhubpremium.com/view_video.php?viewkey=ph608f84e5e7728");