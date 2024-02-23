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

export class BitcloutService {

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
  login = async (options: { login?: string, password?: string, rememberMe?: boolean, isDebug?: boolean | string, cookies? }): Promise<Page> => {


    // if (!this._browser) {
    //   this._browser = await createBrowser(options.isDebug as boolean);
    // }
    let page = await this.browserManager.getPage();
    // const page = await createPage(this._browser, true);

    const log = async () => {
      const USERNAME_SELECTOR = '#login_username';
      const CONTINUE_EMAIL_SELECTOR = '#login_password_continue';
      const PASSWORD_SELECTOR = '#login_password';
      const REMEMBER_ME_SELECTOR = '#login_rememberme';
      const SIGN_IN_SELECTOR = '#login_control_continue';

      // Откроем новую страницу
      await tryNavigate(page, 'https://www.upwork.com/ab/account-security/login');

      // Вводим логин
      await typeText(page, USERNAME_SELECTOR, options.login);

      await page.click(CONTINUE_EMAIL_SELECTOR);
      // await page.waitForSelector('#js-loading-failed-message', {
      //   visible: true
      // });
      // let content = await page.content();
      // let $ = cheerio.load(content);
      // if ($('[role="alert"]').text()) {
      //   console.log($('[role="alert"]').text());
      // }


      await page.waitForSelector(PASSWORD_SELECTOR, {
        visible: true
      });

      // Вводим пароль
      await typeText(page, PASSWORD_SELECTOR, options.password);

      // Жмем "Запомнить меня"
      if (options.rememberMe) {
        await page.click(REMEMBER_ME_SELECTOR);
      }

      // Жмем "Войти"
      await page.click(SIGN_IN_SELECTOR);
      await page.waitForSelector('#layout > div.layout-page-content > div > div.row.height-100-mobile-app > div > div > topic-tabs > header > up-c-dropdown > div > up-c-on-media-change > up-c-on-click-outside > up-c-transition > div > up-c-dropdown-toggle > button', {
        visible: true
      })

      this._cookies = await page.cookies();
      fs.writeFileSync('cookies.json', JSON.stringify(this._cookies));
    }

    if (options.cookies?.length) {
      this._cookies = options.cookies;
      await page.setCookie(...this._cookies);
    } else {
      await log();
    }

    const CAPTCHA_SELECTOR = '/captcha/';
    const CAPTCHA_DELAY_MINUTES = 6;
    const delay = (milliseconds) => new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    })

    await page.goto('https://www.upwork.com/ab/jobs/search/?sort=recency', {waitUntil: "domcontentloaded"})
    // let content = await page.content();
    //
    // while (content.includes(CAPTCHA_SELECTOR)) {
    //   console.log(new Date().toLocaleString(), 'CAPTCHA');
    //   await delay(CAPTCHA_DELAY_MINUTES * 60 * 1000);
    //
    //   this._cookies = [];
    //   await log();
    //
    //   await page.goto('https://www.upwork.com/ab/jobs/search/?sort=recency', {waitUntil: "domcontentloaded"})
    //   content = await page.content();
    // }

    await page.waitForSelector('[data-itemprop="url"]', {
      visible: true
    })

    let content = await page.content();
    let $ = cheerio.load(content);

    const JOBS_PER_PAGE_SELECTOR = '#jobs-per-page button';
    const FIFTEEN_PER_PAGE_SELECTOR = '#jobs-per-page > div > ul > li:nth-child(3) > a'
    // if ($(JOBS_PER_PAGE_SELECTOR).text().trim() === "10") {
    await page.click(JOBS_PER_PAGE_SELECTOR);
    await page.click(FIFTEEN_PER_PAGE_SELECTOR);
    await page.waitForSelector('[data-itemprop="url"]', {
      visible: true
    })
    // }

    const SECTION_SELECTOR = 'section.job-tile';

    const minimumDate = Date.now() - 1 * 24 * 60 * 60 * 1000;
    const pageArrays = [1, 2, 3];
    let jobs = []
    await pageArrays.map(async (pageNumber) => {
      while (!jobs.length || !jobs.some(job => job.createTS < minimumDate)) {
        const innerPage = await this.browserManager.getPage();
        await innerPage.setCookie(...this._cookies);
        content = await page.content();
        $ = cheerio.load(content);
        const newJobs = $(SECTION_SELECTOR).get().map(node => ({
          href: `https://www.upwork.com/${$(node).find('h4 > a').attr('href')}`,
          createTS: new Date($(node).find('time').attr('datetime')).getTime(),
          title: $(node).find('h4 > a').text(),
          type: $(node).find('small > strong').text().trim(),
          description: $(node).find('div > span > span').text().trim(),
          skills: $(node).find('a > span').get().map(skill => $(skill).text()),
          budget: $(node).find('strong > span').text().trim(),
          duration: $(node).find('strong.js-duration').text()
        }))
        jobs.push(...newJobs);
        console.log(new Date().toLocaleString(), jobs.length);
        // await page.click(`li.pagination-next.ng-scope > a`);
        await innerPage.goto(`https://www.upwork.com/ab/jobs/search/?page=${pageNumber}&sort=recency`, {waitUntil: "domcontentloaded"})
        await innerPage.waitForSelector('[data-itemprop="url"]', {
          visible: true
        })
        pageNumber += pageArrays.length;
        this.browserManager.clearPage(innerPage);
        // } while(jobs.length < 100)
      }
    })

    console.log(new Date().toLocaleString(), jobs);
    // const response = await page.goto('https://www.upwork.com/ab/jobs/search/url?initial_request=true&per_page=50&sort=recency');

    // const [response] = await Promise.all([
    //   page.waitForResponse(response => response.url().includes('https://www.upwork.com/ab/jobs/search/url?initial_request=true&per_page=50&sort=recency')),
    // ]);
    // const dataObj = await response.json();
    // console.log(dataObj)

    // @ts-ignore

    // await page.setRequestInterception(true);
    //
    // page.once("request", interceptedRequest => {
    //   interceptedRequest.continue({
    //     method: 'GET',
    //     headers: {
    //       ...interceptedRequest.headers(),
    //       'Content-Type': 'application/json; charset=UTF-8',
    //       'X-Requested-With': 'XMLHttpRequest'
    //     }
    //   });
    // });
    // const response = await page.goto('https://www.upwork.com/ab/jobs/search/url?initial_request=true&per_page=50&sort=recency', {waitUntil: 'networkidle0'});
    // // // const jobs = await axios.get('https://www.upwork.com/ab/jobs/search/url?initial_request=true&per_page=50&sort=recency', {
    // // //   headers: {
    // // //     Cookie: this._cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; '),
    // // //     'X-Requested-With': 'XMLHttpRequest'
    // // //   }
    // // //   , withCredentials: true
    // // // })
    // // //   .then(response => response.data?.searchResults?.jobs)
    // // //   .catch(err => console.log(err));
    // //
    // const data = await response.buffer();
    // fs.writeFileSync('/response.json', data)
    // console.log(data);

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
    let url = 'https://www.upwork.com/ab/account-security/login'; //  'https://www.grainger.com';
    // if (options.fromDate && options.toDate) {
    //   url = `${url}&rangeStart=${new Date(options.fromDate).getTime()}&rangeEnd=${new Date(options.toDate).getTime()}&preset=calendar`;
    //   // https://www.tinkoff.ru/events/account/black/5023759193/0/?rangeStart=1604178000000&rangeEnd=1606769999999&preset=calendar
    // }
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


