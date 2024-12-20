const puppeteer = require("puppeteer");
const fs = require('fs');

const blockRequest = (url) => {
    return false;
    // return (
    //     url.includes("www.google-analytics.com") ||
    //     url.includes("gtm.js") ||
    //     url.includes("recaptcha") ||
    //     url.includes("site-360.js") ||
    //     url.includes(".woff")
    // );
};

async function run() {
    const gotoParams = {
        waitUntil: "domcontentloaded",
        timeout: 30000, //10000,
    };
    const browser = await puppeteer.launch({
        args: [
            "--disable-accelerated-2d-canvas",
            "--disable-backgrounding-occluded-windows",
            // Disable crash reporting
            "--disable-breakpad",
            // May cause memory leak, but browser is restarted often anyway
            "--disable-dev-shm-usage",
            "--disable-extensions",
            "--disable-gpu",
            "--disable-logging",
            "--disable-notifications",
            "--disable-setuid-sandbox",
            "--disable-software-rasterizer",
            "--ignore-certificate-errors",
            "--mute-audio",
            "--no-default-browser-check",
            "--no-experiments",
            "--no-first-run",
            "--no-sandbox",
            "--no-zygote",
        ],
        acceptInsecureCerts: true,
        headless: false,
        devtools: true,
        onExit: async (e) => {
            console.log(e);
        },
    });

    const page = await browser.newPage();
    try {
        await page.setRequestInterception(true);
        page.setExtraHTTPHeaders({ DNT: "1" });

        // Desktop
        // await page.setViewport({
        //     width: 1280,
        //     height: 800,
        //     deviceScaleFactor: 1,
        //     isMobile: false,
        //     hasTouch: false,
        //     isLandscape: false
        // });

        // Mobile
        await page.setViewport({
            width: 412,
            height: 600,
            deviceScaleFactor: 1,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
          });

        page.on("request", (request) => {
            const u = request.url();
            // console.log(`Loading: ${u}`);
            if (blockRequest(u)) {
                console.log(`request to ${u} is aborted`);
                request.abort();
            } else {
                request.continue();
            }
        });

        // 360
        // await page.goto("D:\\Githubs\\puppetter\\site-360.html", gotoParams);
        // await page.goto( "https://simply360.com.au/blog/portfolio/loan-market-select-google-maps-tour/", gotoParams );

        // Recipes
        // await page.goto("D:\\Githubs\\puppetter\\site-recipes.html", gotoParams);
        // await page.goto(
        //     "https://vargasavourrecipes.com/french-bean-casserole",
        //     gotoParams
        // );

        // const date = new Date();
        // await page.screenshot({
        //     path: "screenshots/" + date.getTime() + ".png",
        // });

        const site_url = "https://iogringo.com.br/";
        let folder = site_url.replace('https://', '').split('?');
        folder = folder[0];
        await page.goto( site_url, gotoParams );
        await page.waitForNavigation();

        await page.evaluate(_ => {
            window.scrollBy(0, window.innerHeight);
        });

        const data = [[], []];

        // Scripts data
        for (const element of await page.$$("script")) {
            let dataAdd = await element.evaluate((el) => el.getAttribute("onload"));
            dataAdd += '; type=' + await element.evaluate((el) => el.getAttribute("type"));
            dataAdd += '; src=' + await element.evaluate((el) => el.getAttribute("href"));

            data[0].push(dataAdd);
        }

        // Styles data
        for (const element of await page.$$("link")) {
            let as = await element.evaluate((el) => el.getAttribute("as"));
            if( as === 'style' ){
                let dataAdd = await element.evaluate((el) => el.getAttribute("onload"));
                dataAdd += '; src=' + await element.evaluate((el) => el.getAttribute("href")) + '\n';

                data[1].push(dataAdd);
            }
        }

        // Images data
        // const data = [[],[],[],[]];
        // for (const image of await page.$$("img")) {
        //     const src = await image.evaluate((img) => img.getAttribute("src"));
        //     const currentSrc = await image.evaluate((img) => img.currentSrc);
        //     const classData = await image.evaluate((img) => img.getAttribute("class"));
        //     const dataSrc = await image.evaluate((img) => img.getAttribute("data-src"));

        //     data[0].push(src);
        //     data[1].push(currentSrc);
        //     data[2].push(classData);
        //     data[3].push(dataSrc);
        // }

        // const data = await page.evaluate((body) => {
        //     let imgs = document.querySelectorAll('img');
        //     let images = [];
        //     let imagesCurrent = [];
        //     let imagesClass = [];

        //     for (var img of imgs) {
        //         images.push(img.getAttribute('src'));
        //         imagesClass.push(img.getAttribute('class'));
        //         imagesCurrent.push(img.currentSrc);
        //     }

        //     return [ images, imagesCurrent, imagesClass ];
        // });

        // Scripts
        let dir = './scripts/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(dir+'/scripts.txt', JSON.stringify(data[0]));

        // Styles
        dir = './styles/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        fs.writeFileSync(dir+'/styles.txt', JSON.stringify(data[1]));

        // // Images
        // let dir = './images/'+folder;
        // if (!fs.existsSync(dir)){
        //     fs.mkdirSync(dir);
        // }
        // fs.writeFileSync(dir+'/src.txt', JSON.stringify(data[0]));
        // fs.writeFileSync(dir+'/currentSrc.txt', JSON.stringify(data[1]));
        // fs.writeFileSync(dir+'/currentClass.txt', JSON.stringify(data[2]));
        // fs.writeFileSync(dir+'/dataSrc.txt', JSON.stringify(data[3]));
    } catch (e) {
        console.log(e);
    }

    // await browser.close();
}

run();
