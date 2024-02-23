import * as puppeteer from "puppeteer";
import { Browser, Page } from "puppeteer";
import '../utils/puppeteer-extension';
import { createBrowser, createPage, isExist, tryNavigate, typeText } from "../utils/puppeteer-extension";
import { Cookie } from "puppeteer";
import { BrowserManager } from "../utils/browser-manager";
import { default as axios } from 'axios';
import * as fs from 'fs';

import * as dotenv from 'dotenv';

const cheerio = require('cheerio');

export class TinkoffService {

  private _cookies: Cookie[] = [];
  private _browser: Browser;
  private browserManager: BrowserManager;

  constructor() {
    dotenv.config()

    this.browserManager = new BrowserManager();
    this.browserManager.init(1, 5);
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

  /**
   * Авторизовывается на странице и возвращает страницу с кукисами
   * @param options
   */
  login = async (options: { login?: string, password?: string, rememberMe?: boolean, isDebug?: boolean | string }): Promise<Page> => {

    const USERNAME_SELECTOR = '#el-login';
    const PASSWORD_SELECTOR = '#el-passwd';
    const REMEMBER_ME_SELECTOR = '#el-autologin';
    const SIGN_IN_SELECTOR = '#el-singin';

    if (!this._browser) {
      this._browser = await createBrowser(options.isDebug as boolean);
    }

    const page = await createPage(this._browser);

    if (this._cookies.length) {
      await page.setCookie(...this._cookies);
      return;
    }

    // Откроем новую страницу
    await tryNavigate(page, 'https://www.tinkoff.ru/login/');

    // Вводим логин
    // await typeText(page, USERNAME_SELECTOR, options.login);

    // Вводим пароль
    // await typeText(page, PASSWORD_SELECTOR, options.password);

    // Жмем "Запомнить меня"
    // if (options.rememberMe) {
    // await page.click(REMEMBER_ME_SELECTOR);
    // }

    // Жмем "Войти"
    // await page.click(SIGN_IN_SELECTOR);
    await page.waitForSelector('h2[data-qa-file="DashboardTitle"]', {
      visible: true
    });

    this._cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(this._cookies));

    return page;
  };

  async getAverageTransfers(options: {
    isDebug?: boolean | string,
    fromDate?: string,
    toDate?: string,
    cookies: Cookie[]
  }) {

    const CATEGORY_SELECTOR = 'div.PieBanner__content_g2GiDk > div > div.GridColumn__column_a2s5hZ.GridColumn__column_size_12_y2s5hZ.GridColumn__column_size_tabletS_8_O2s5hZ.GridColumn__column_size_desktopS_9_-L2s5hZ.GridColumn__column_size_desktopM_8_ga2s5hZ > div > div > div.Tag__tagContent_k2PR1x.Tag__tagContent_icon_m2PR1x';
    const OTHER_CATEGORY_SELECTOR = 'div.PieBanner__content_g2GiDk > div > div.GridColumn__column_a2s5hZ.GridColumn__column_size_12_y2s5hZ.GridColumn__column_size_tabletS_8_O2s5hZ.GridColumn__column_size_desktopS_9_-L2s5hZ.GridColumn__column_size_desktopM_8_ga2s5hZ > div > div:last-child';

    if (!this._browser) {
      this._browser = await createBrowser(options.isDebug as boolean);
    }

    const page = await createPage(this._browser);

    if (options.cookies) {
      await page.setCookie(...options.cookies);
    }

    // Откроем новую страницу
    let url = 'https://www.tinkoff.ru/events/account/black/5023759193/0/?from=db_accounts';
    if (options.fromDate && options.toDate) {
      url = `${url}&category=Переводы&rangeStart=${new Date(options.fromDate).getTime()}&rangeEnd=${new Date(options.toDate).getTime()}&preset=calendar`;
      // https://www.tinkoff.ru/events/account/black/5023759193/0/?rangeStart=1604178000000&rangeEnd=1606769999999&preset=calendar
    }
    await tryNavigate(page, url);

    const PASSWORD_SELECTOR = 'body > div.application > div > div > div > div._1jUdq > div._1gFPc > div:nth-child(2) > div.M16bJ > div > div._329R7 > div > div:nth-child(2) > div > div > div > div:nth-child(1) > form > div.ui-form__row.G_ira.ui-form__row_login > div > div > div > div > label > div.ui-input__column > input';
    const SUBMIT_SELECTOR = 'body > div.application > div > div > div > div._1jUdq > div._1gFPc > div:nth-child(2) > div.M16bJ > div > div._329R7 > div > div:nth-child(2) > div > div > div > div:nth-child(1) > form > div.ui-form__row.G_ira.ui-form__row_login > div > div > div > div > label > div.ui-input__column > input';

    if (await isExist(page, PASSWORD_SELECTOR, 5000)) {
      await typeText(page, PASSWORD_SELECTOR, process.env.TINKOFF_PASSWORD);
      await page.click(SUBMIT_SELECTOR);
    }

    await page.waitForSelector('[data-qa-file="Pie"]', {
      visible: true
    });

    this._cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(this._cookies));

    let content = await page.content();
    let $ = cheerio.load(content);

    const haveOthers = $(CATEGORY_SELECTOR).get().filter(node => $(node).text().includes('Остальное'));

    if (haveOthers.length) {
      await page.click(OTHER_CATEGORY_SELECTOR);
      content = await page.content();
      $ = cheerio.load(content);
    }

    const categories = $(CATEGORY_SELECTOR).get().map(node => {
      return {
        name: $(node.children[1]).text(),
        amount: +$(node.children[2]).text()
          .trim()
          .replace(/[^\x20-\x7E]/g, '')
          .replace('₽', '')
      };
    });
    return categories;
  }

  async getAllCategoriesPurchases(options: {
    isDebug?: boolean | string,
    fromDate?: string,
    toDate?: string,
    cookies: Cookie[]
  }) {

    const CATEGORY_SELECTOR = 'div.PieBanner__content_g2GiDk > div > div.GridColumn__column_a2s5hZ.GridColumn__column_size_12_y2s5hZ.GridColumn__column_size_tabletS_8_O2s5hZ.GridColumn__column_size_desktopS_9_-L2s5hZ.GridColumn__column_size_desktopM_8_ga2s5hZ > div > div > div.Tag__tagContent_k2PR1x.Tag__tagContent_icon_m2PR1x';
    const OTHER_CATEGORY_SELECTOR = 'div.PieBanner__content_g2GiDk > div > div.GridColumn__column_a2s5hZ.GridColumn__column_size_12_y2s5hZ.GridColumn__column_size_tabletS_8_O2s5hZ.GridColumn__column_size_desktopS_9_-L2s5hZ.GridColumn__column_size_desktopM_8_ga2s5hZ > div > div:last-child';

    if (!this._browser) {
      this._browser = await createBrowser(options.isDebug as boolean);
    }

    const page = await createPage(this._browser);

    if (options.cookies) {
      await page.setCookie(...options.cookies);
    }

    // Откроем новую страницу
    let url = 'https://www.tinkoff.ru/events/account/black/5023759193/0/?from=db_accounts';
    if (options.fromDate && options.toDate) {
      url = `${url}&rangeStart=${new Date(options.fromDate).getTime()}&rangeEnd=${new Date(options.toDate).getTime()}&preset=calendar`;
      // https://www.tinkoff.ru/events/account/black/5023759193/0/?rangeStart=1604178000000&rangeEnd=1606769999999&preset=calendar
    }
    await tryNavigate(page, url);

    const PASSWORD_SELECTOR = 'body > div.application > div > div > div > div._1jUdq > div._1gFPc > div:nth-child(2) > div.M16bJ > div > div._329R7 > div > div:nth-child(2) > div > div > div > div:nth-child(1) > form > div.ui-form__row.G_ira.ui-form__row_login > div > div > div > div > label > div.ui-input__column > input';
    const SUBMIT_SELECTOR = 'body > div.application > div > div > div > div._1jUdq > div._1gFPc > div:nth-child(2) > div.M16bJ > div > div._329R7 > div > div:nth-child(2) > div > div > div > div:nth-child(1) > form > div.ui-form__row.G_ira.ui-form__row_login > div > div > div > div > label > div.ui-input__column > input';

    if (await isExist(page, PASSWORD_SELECTOR, 5000)) {
      await typeText(page, PASSWORD_SELECTOR, process.env.TINKOFF_PASSWORD);
      await page.click(SUBMIT_SELECTOR);
    }

    await page.waitForSelector('[data-qa-file="Pie"]', {
      visible: true
    });

    this._cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(this._cookies));

    let content = await page.content();
    let $ = cheerio.load(content);

    const haveOthers = $(CATEGORY_SELECTOR).get().filter(node => $(node).text().includes('Остальное'));

    if (haveOthers.length) {
      await page.click(OTHER_CATEGORY_SELECTOR);
      content = await page.content();
      $ = cheerio.load(content);
    }

    const categories = $(CATEGORY_SELECTOR).get().map(node => {
      return {
        name: $(node.children[1]).text(),
        amount: +$(node.children[2]).text()
          .trim()
          .replace(/[^\x20-\x7E]/g, '')
          .replace('₽', '')
      };
    });
    return categories;
  }
}


