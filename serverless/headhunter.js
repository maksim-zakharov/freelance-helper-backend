module.exports.getVacancies = async (event, context) => {
    const puppeteer = require("puppeteer");

    let pageUrl = 'https://hh.ru/search/vacancy';
    let text = 'angular';
    let experience = 'between1And3';
    let employment = 'full';
    let schedule = 'fullDay';

    // const { url } = event.queryStringParameters;

    if (event.queryStringParameters) {
        if (event.queryStringParameters.text) {
            text = event.queryStringParameters.text
        }
        if (event.queryStringParameters.experience) {
            experience = event.queryStringParameters.experience
        }
        if (event.queryStringParameters.employment) {
            employment = event.queryStringParameters.employment
        }
        if (event.queryStringParameters.schedule) {
            schedule = event.queryStringParameters.schedule
        }
    }

    pageUrl += `?text=${text}&experience=${experience}&employment=${employment}&schedule=${schedule}`;

    const browser = puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080'
        ]
    });

    const page = await browser.newPage();

    await Promise.all([
        page.goto(pageUrl, {waitUntil: "networkidle2",})
        , page.waitForNavigation({waitUntil: 'networkidle2'})
    ]);

    const content = await page.evaluate(() => document.body.innerHTML);

    return {
        statusCode: 200,
        body: JSON.stringify({
            content,
        }),
    };
};
