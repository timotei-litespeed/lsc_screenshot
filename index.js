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

async function run(url, action = 'before') {
    const urlForTest = url + ( action === 'before' ? '?LSCWP_CTRL=before_optm' : '' );
    const gotoParams = {
        waitUntil: "networkidle2",
        timeout: 10000,
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
    const screensSizes = {
        mobile: {
            width:412,
            height: 600,
        },
        desktop: {
            width: 1280,
            height: 800,
        }
    }

    async function scrollAllPage(screensSizes, gotoTop = false){
        await page.evaluateHandle(async(screensSizes, gotoTop) => {
            if( gotoTop ) window.scrollTo(0, 0);
            let fullHeight = document.documentElement.scrollHeight;
            let steps = Math.ceil(fullHeight / screensSizes.mobile.height);
            for(let i=0;i<steps;i++){
                window.scrollBy(0, screensSizes.mobile.height);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Wait a little for content to load
            await new Promise(resolve => setTimeout(resolve, 2000));
        }, screensSizes, gotoTop);
    }

    const page = await browser.newPage();
    try {
        // Need to add both
        await page.setRequestInterception(true);
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

        // get folder name and create path
        let folder = url.replace('https://', '').split('?');
        folder = folder[0];
        folder = folder.split('/');
        folder = folder[0];
        dir = './screenshots/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        dir += folder + '/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        dir += action + '/';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        // https://stackoverflow.com/questions/47539043/how-to-get-all-console-messages-with-puppeteer-including-errors-csp-violations
        fs.appendFileSync(dir + 'console.txt', "Mobile logs:\r\n");
        page
        .on('console', message => {
          const type = message.type().substr(0, 3).toUpperCase()

          fs.appendFileSync(dir + 'console.txt', type + ': ' + message.text() + "\r\n");
        })
        
        // Mobile
        await page.setViewport({
            deviceScaleFactor: 1,
            isMobile: true,
            hasTouch: true,
            ...screensSizes.mobile
          });
        await page.goto( urlForTest, gotoParams );

        // Mobile screenshot
        await scrollAllPage(screensSizes);
        await page.screenshot({ path: dir + 'mobile.png', fullPage: true, captureBeyondViewport: true});
 

        // Desktop screenshot
        fs.appendFileSync(dir + 'console.txt', "\r\nDesktop logs:\r\n");
        await page.setViewport({
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            ...screensSizes.desktop
        }); // Reload not needed because of changing isMobile. See https://pptr.dev/api/puppeteer.page.setviewport#remarks
        await scrollAllPage(screensSizes, true);
        await page.screenshot({ path: dir + 'desktop.png', fullPage: true, captureBeyondViewport: true });

        await browser.close();
    } catch (e) {
        console.log(e);
    }
}

const url = 'https://bbso.ro';
// run(url);
run(url, 'after');