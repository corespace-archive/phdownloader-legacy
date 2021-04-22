const nodefetch = require("node-fetch");
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const fsExtra = require('fs-extra')

function cleanUP(directory) {
    fsExtra.emptyDirSync(directory);
    // fs.unlinkSync("master.m3u8");
}

function printProgress(mix, max){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Downloaded ${mix} of ${max}`);
}

async function downloadVideo() {
    const maxCount = 443;
    for (let i = 1; i < maxCount; i++) {
        const content = await nodefetch(`https://dv-h.phprcdn.com/hls/videos/202102/10/383320252/,2160P_8000K,1440P_6000K,1080P_4000K,720P_4000K,480P_2000K,240P_1000K,_383320252.mp4.urlset/seg-${i}-f3-v1-a1.ts?ttl=1618999257&l=0&ipa=95.81.1.215&hash=43376d61174355239cd4f44e8127b87e`, {
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
            // fs.readFile(`downloads/sec_${i}.ts`, function (err, data) {
            //     if (err) throw err;
            //     if(data.includes('Not Found')){
            //         console.log("END of Transmission");
            //         i=700;
            //         return 0;
            //     } else {
            //         response.pipe(file);
            //     }
            // });
            response.pipe(file);
        });
        printProgress(i, maxCount);
    }
}


cleanUP("downloads");
downloadVideo();