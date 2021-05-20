const fs = require("fs");
const { FFmpeg, ffprobe, ffprobeSync } = require("kiss-ffmpeg");

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

function convM3u8() {
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

convM3u8();