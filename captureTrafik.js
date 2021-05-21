const puppeteer = require("puppeteer");
const fs = require('fs');
const fsExtra = require("fs-extra");
const fsp = require('fs').promises;

function cleanUP(directory) {
    fsExtra.emptyDirSync(directory);
    if (fs.existsSync("master.m3u8")) {
        fs.unlinkSync("master.m3u8");
    }
}

fs.writeFileSync('./data/capture.xhr', "",{encoding:'utf8',flag:'w'});

async function getData() {
    const videoElementRaw = document.getElementById("mgp_videoWrapper")[0].children;
    return getData;
}

async function captureTraffic() {
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
            await page.type("#password", "dgbw8nyvXZvLQTzQMiAZo5L2y6eJbmFCBQtPMP5H", {delay: 100});
            await page.click('#submitLogin'); 
            await page.waitForNavigation(); 
    
            const cookies = await page.cookies();
            await fsp.writeFile('./data/cookies.json', JSON.stringify(cookies, null, 2));
        }


        // var myArgs = process.argv.slice(2)[0];
        // if (myArgs[0]) {
        //     let videoURL = myArgs[0];
        // } else {
        //     let videoURL = 'https://de.pornhubpremium.com/view_video.php?viewkey=ph5f350400af944';
        // }
        
        if (!process.argv.slice(2)[0]) {
            console.log("No URL provided"); 
            return;
        }

        await page.goto(process.argv.slice(2)[0], {waitUntil: 'load', timeout: 0});

        let videoTitle = await page.evaluate(() => {
            let videoTitleElement = document.getElementById("videoTitle").children[1];
            let videoTitle = videoTitleElement.innerHTML;

            return videoTitle;
        });

        await page.evaluateHandle(() => {
            document.getElementsByTagName("video")[0].currentTime = ((document.getElementsByTagName("video")[0].duration) - 20);

            const storageHolder = document.createElement('a');
            storageHolder.innerHTML = ((document.getElementsByTagName("video")[0].duration) + 10);
            storageHolder.setAttribute("id", "stHolder");
            document.body.appendChild(storageHolder);
        });

        const inner_html = await page.$eval('#stHolder', element => element.innerHTML);

        console.log(inner_html);
        
        await page.click('.mgp_playPause');        
        // await page.waitForNavigation({waitUntil: 'load', timeout: 0});

        await page.setRequestInterception(true);
        await page.on('request', (request) => {
            let reqContent = request.url();
            if (reqContent.includes("hls")) {
                let requestURL = request.url();
                let dataBlock = {
                    "title": videoTitle,
                    "url": requestURL
                };
                fs.writeFileSync('./data/capture.xhr', JSON.stringify(dataBlock));
            }
            request.continue();
        });
        
        setTimeout(function(){ browser.close(); }, inner_html);
}

cleanUP("downloads");
captureTraffic();
