const puppeteer = require("puppeteer");
const fs = require('fs');
const fsp = require('fs').promises;

fs.writeFileSync('./data/capture.xhr', "",{encoding:'utf8',flag:'w'});

async function getData() {
    const videoElementRaw = document.getElementById("mgp_videoWrapper")[0].children;
    return getData;
}

async function test() {
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
            await page.type("#username", "USERNAME", {delay: 100});
            await page.click("#password");
            await page.type("#password", "PASSWORD", {delay: 100});
            await page.click('#submitLogin'); 
            await page.waitForNavigation(); 
    
            const cookies = await page.cookies();
            await fsp.writeFile('./data/cookies.json', JSON.stringify(cookies, null, 2));
        }

        await page.goto('VIDEOURL', {waitUntil: 'load', timeout: 0});

        let videoTitle = await page.evaluate(() => {
            let videoTitleElement = document.getElementById("videoTitle").children[1];
            let videoTitle = videoTitleElement.innerHTML;

            return videoTitle;
        });

        await page.evaluateHandle(() => {
            document.getElementsByTagName("video")[0].currentTime = ((document.getElementsByTagName("video")[0].duration) - 10);

            const storageHolder = document.createElement('a');
            storageHolder.innerHTML = document.getElementsByTagName("video")[0].duration;
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

test();
