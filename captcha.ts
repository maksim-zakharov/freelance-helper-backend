import puppeteer from "puppeteer-extra";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { Page } from "puppeteer";

const pluginStealth = require('puppeteer-extra-plugin-stealth'); // Use v2.4.5 instead of latest

puppeteer.use(pluginStealth());
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: "3c35db9cd80c8cb55e6051ce90a23f8b", // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  }),
);

export const resolveCaptcha = async (externalPage: Page) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--enable-features=NetworkService",
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080'
    ],
    ignoreHTTPSErrors: true
  });
  const page = await browser.newPage();
  await Promise.all([
    page.goto(externalPage.url(), {waitUntil: "domcontentloaded",})
    , page.waitForNavigation({waitUntil: 'domcontentloaded'})
  ])

  await page.solveRecaptchas();

  await externalPage.setCookie(...await page.cookies());
  // await Promise.all([
  //   externalPage.goto(externalPage.url(), {waitUntil: "networkidle2",})
  //   , externalPage.waitForNavigation({waitUntil: 'networkidle2'})
  // ])
}
