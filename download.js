const { FFmpeg, ffprobe, ffprobeSync } = require("kiss-ffmpeg");
const nodefetch = require("node-fetch");
const https = require('https');
const fsExtra = require('fs-extra')
const fs = require('fs');

// removing Temporary files and directories
function cleanUP(directory) {
    fsExtra.emptyDirSync(directory);
    // fs.unlinkSync("master.m3u8");
}

// Printing current download progress to console
function printProgress(mix, max){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Downloaded ${mix} of ${max}`);
}

// loading master.m3u8 as input file
// master.m3u8 includes all sec_*.ts files with timing
function convMP4() {
    ffmpeg = new FFmpeg({
        inputs: "downloads/master.m3u8",
        outputs:  { 
            url: "file.mp4",
            options: { 
                "vcodec": "copy", 
                "c": "copy",
                "crf": "50"
            } 
        }
    });
    ffmpeg.run();
}

// creating the video structure file by looping over all files
// in the download folder.
function convM3u8() {
    const testFolder = './downloads/';
    fs.readdir(testFolder, (err, files) => {
        const fileCount = (( files.length + 1 ));
        for (let i = 1; i < fileCount; i++) {
            
            console.log(`i[${i}] - f[${fileCount}]`);
            
    
            if (i == 1) {
                fs.appendFileSync('master.m3u8', '#EXTM3U\n');
                fs.appendFileSync('master.m3u8', '#EXT-X-TARGETDURATION:10\n');
                fs.appendFileSync('master.m3u8', '#EXT-X-MEDIA-SEQUENCE:1\n');
    
                fs.appendFileSync('master.m3u8', '#EXTINF:10, no desc\n');
                fs.appendFileSync('master.m3u8', `seg_${i}.ts\n`);
            } else if (i == 222){
                fs.appendFileSync('master.m3u8', '#EXT-X-ENDLIST');
            } else if (i < fileCount && i != 0) {
                fs.appendFileSync('master.m3u8', '#EXTINF:10, no desc\n');
                fs.appendFileSync('master.m3u8', `seg_${i}.ts\n`);
            } else {
                console.log("ERROR");
                // ffmpeg -i "conv/master.m3u8" -vcodec copy -c copy -crf 50 file.mp4
            }
        }
        
        // Creating a copy of the master.m3u8 file in the download folder
        fs.copyFile('master.m3u8', 'downloads/master.m3u8', (err) => {
            if (err) throw err;
            console.log('source.txt was copied to destination.txt');
            convMP4();
        });
    })
}

// fetching all segments of the video file by looping a given amount of times
// TODO: auto detect end of transmition and closing the loop
async function downloadVideo() {
    const maxCount = 223;
    for (let i = 1; i < maxCount; i++) {
        const content = await nodefetch(`https://dv-h.phprcdn.com/hls/videos/202104/13/386547271/,1080P_4000K,720P_4000K,480P_2000K,240P_1000K,_386547271.mp4.urlset/seg-${i}-f1-v1-a1.ts?ttl=1618755107&l=0&hash=9d710f67800404f568244e4bdf87a709`, {
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
      
        // creating the seg_*.ts files from filestream
        const file = fs.createWriteStream(`downloads/seg_${i}.ts`);
        const request = https.get(content.url, function(response) {
            response.pipe(file);
        });
        printProgress(i, maxCount);
    }
}


cleanUP("downloads");
downloadVideo();
convM3u8();