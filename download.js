const nodefetch = require("node-fetch");
const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const fsExtra = require('fs-extra')

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

async function downloadVideo() {
    cleanUP("downloads");
    let videoData = JSON.parse(fs.readFileSync("./data/capture.xhr"));
    const source = videoData["url"];
    console.log(source);
    // const source = "https://dv-h.phprcdn.com/hls/videos/202012/10/378121982/,201211_1831_1080P_4000K,201211_1831_720P_4000K,201211_1831_480P_2000K,201211_1831_240P_1000K,_378121982.mp4.urlset/seg-684-f2-v1-a1.ts?ttl=1621518087&l=0&ipa=149.224.235.181&hash=9a460d005c0262935ee7c5740e7d0a33";
    let sourceArray = source.split("-");
    let segmentCount = Number(sourceArray[2]);
    sourceArray[2] = "${i}";
    let sourceArray2 = source.split(segmentCount);

    let maxCount = (( segmentCount + 1 ));
    // console.log(sourceArray2[0] + `${i}` + sourceArray2[1]);
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
        if (i == maxCount) {
            return true;
        }
    }
    // console.log(maxCount);
}

// cleanUP("downloads");
downloadVideo();

// module.exports.downloadVideo = downloadVideo;