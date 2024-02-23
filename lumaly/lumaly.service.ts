import { Browser, Page } from "puppeteer";
import '../utils/puppeteer-extension';
import { createBrowser, isExist, tryNavigate, typeText } from "../utils/puppeteer-extension";
import { Cookie } from "puppeteer";
import { BrowserManager } from "../utils/browser-manager";
import * as fs from 'fs';

import * as dotenv from 'dotenv';
import { createPage } from "../utils/puppeteer-extension";

const cheerio = require('cheerio');

const delay = (milliseconds) => new Promise(resolve => {
  setTimeout(resolve, milliseconds);
})

export class LumalyService {

  private _cookies: Cookie[] = [];
  private _browser: Browser;
  private browserManager: BrowserManager;

  constructor() {
    dotenv.config()

    this.browserManager = new BrowserManager(true);
    this.browserManager.init(1, 1);
  }

  selectMany = <T>(items, predicate?: (value: T) => unknown): T => {
    return items.map(predicate).reduce((arr, curr) => arr.concat(curr), []);
  };

  distinct = <T>(items, selector?: (x: T) => unknown): Array<T> => {
    if (!selector) {
      return Array.from<T>(new Set(items));
    }
    const result = [];
    const resultIndex = [];
    const selectedItems = items.map(selector);
    selectedItems.forEach((el, index) => {
      if (!resultIndex.includes(el)) {
        resultIndex.push(el);
        result.push(items[index]);
      }
    });
    return result;
  };

  login = async (options: { isDebug }) => {
    const page = await this.browserManager.getPage();

    await tryNavigate(page, 'https://dev-admin.lumaly.de/login');
    const EMAIL_INPUT = '#email';
    const PASSWORD_INPUT = '#password';
    const SUBMIT_BUTTON = '[type=submit]';
    await typeText(page, EMAIL_INPUT, 'max89701@gmail.com');
    await typeText(page, PASSWORD_INPUT, 'Dt8Q%$$EHV9a&R');
    await page.click(SUBMIT_BUTTON);

    await delay(1500);

    this.browserManager.clearPage(page);
  }

  editShopRule = async (options: { shopDomain, isDebug }): Promise<any> => {

    const {shopDomain, isDebug} = options;

    const page = await this.browserManager.getPage();

    const SUBMIT_BUTTON = '[type=submit]';

    await tryNavigate(page, `https://dev-admin.lumaly.de/shops-rules?search=${options.shopDomain}`);

    if (!(await isExist(page, '.fa-edit'))) {
      this.browserManager.clearPage(page);
      await this.addNewShopRule({shopDomain, isDebug});
      return;
    }

    await page.click('.fa-edit')

    await delay(1500);
    if (await isExist(page, `.select2-selection__choice[title="jquery.min.js"] span`)) {
      await page.click(`.select2-selection__choice[title="jquery.min.js"] span`)
    }
    const JS_FILES_SELECT = '#js-group .select2-search__field';

    if (!(await isExist(page, `.select2-selection__choice[title="helper-scripts/autoapply-interpreter.js"] span`))) {
      await typeText(page, JS_FILES_SELECT, `helper-scripts/autoapply-interpreter.js`);
      await page.keyboard.press('Enter');
    }

    if (!(await isExist(page, `.select2-selection__choice[title="helper-scripts/autoapply-v2.js"] span`))) {
      await typeText(page, JS_FILES_SELECT, `helper-scripts/autoapply-v2.js`);
      await page.keyboard.press('Enter');
    }

    // if (await isExist(page, `.select2-selection__choice[title="*://*.${options.shopDomain}/*/checkout*"] span`)) {
    //   await page.click(`.select2-selection__choice[title="*://*.${options.shopDomain}/*/checkout*"] span`)
    // } else if (await isExist(page, `.select2-selection__choice[title=""*://*.${options.shopDomain}/checkout*""] span`)) {
    //   await page.click(`.select2-selection__choice[title=""*://*.${options.shopDomain}/checkout*""] span`)
    // } else if (await isExist(page, `.select2-selection__choice[title="*://*.${options.shopDomain}/checkout*"] span`)) {
    //   await page.click(`.select2-selection__choice[title="*://*.${options.shopDomain}/checkout*"] span`)
    // } else {
    //   this.browserManager.clearPage(page);
    //   return;
    // }

    // await typeText(page, 'div:nth-child(5) > span > span.selection > span > ul > li > input', `*://*.${options.shopDomain}/*`);
    // await page.keyboard.press('Enter');

    await page.click(SUBMIT_BUTTON);

    // await page.waitForSelector('.alert alert-info');
    await delay(1500);

    console.log(`Shop rules for ${options.shopDomain} edited.`);

    this.browserManager.clearPage(page);
  };

  addNewShopRule = async (options: { shopDomain, isDebug }): Promise<any> => {

    const page = await this.browserManager.getPage();

    const SHOP_SELECT_INPUT = '.select2-dropdown .select2-search__field';
    const SCRIPT_NAME_INPUT = '#script-name-group input';
    const JS_FILES_SELECT = '#js-group .select2-search__field';
    const SUBMIT_BUTTON = '[type=submit]';

    await tryNavigate(page, 'https://dev-admin.lumaly.de/shops-rules/create');

    await page.click('span.selection > span')

    await typeText(page, SHOP_SELECT_INPUT, options.shopDomain);
    await delay(500);
    await page.keyboard.press('Enter');

    await typeText(page, SCRIPT_NAME_INPUT, `${options.shopDomain}.json`);

    await typeText(page, JS_FILES_SELECT, `content.js`);
    await page.keyboard.press('Enter');

    await typeText(page, JS_FILES_SELECT, `helper-scripts/autoapply-interpreter.js`);
    await page.keyboard.press('Enter');

    await typeText(page, JS_FILES_SELECT, `helper-scripts/autoapply-v2.js`);
    await page.keyboard.press('Enter');

    await typeText(page, 'div:nth-child(5) > span > span.selection > span > ul > li > input', `*://*.${options.shopDomain}/*`);
    await page.keyboard.press('Enter');

    await page.click(SUBMIT_BUTTON);

    // await page.waitForSelector('.alert alert-info');
    await delay(1500);

    console.log(`Shop rules for ${options.shopDomain} added.`);

    this.browserManager.clearPage(page);
  };
}


