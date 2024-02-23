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

export class LowadiService {

  private _cookies: Cookie[] = [];
  private _browser: Browser;
  private browserManager: BrowserManager;

  constructor() {
    dotenv.config()

    this.browserManager = new BrowserManager();
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

  /**
   * Авторизовывается на странице и возвращает страницу с кукисами
   * @param options
   */
  login = async (options: { login?: string, password?: string, rememberMe?: boolean, isDebug?: boolean | string }): Promise<Page> => {

    const USERNAME_SELECTOR = '#login';
    const PASSWORD_SELECTOR = '#password';
    const REMEMBER_ME_SELECTOR = '#autoidentification';
    const SIGN_IN_SELECTOR = '#authentificationSubmit';

    if (!this._browser) {
      this._browser = await createBrowser(options.isDebug as boolean);
    }

    const page = await createPage(this._browser, true);

    if (this._cookies.length) {
      await page.setCookie(...this._cookies);
      return;
    }

    // Откроем новую страницу
    await tryNavigate(page, 'https://www.lowadi.com/site/logIn');

    // Удаляем блокировку экрана

    await page.evaluate((sel) => {
      var buttons = Array.from(document.querySelectorAll(sel));
      if (buttons.length > 1) {
        buttons.slice(-1)[0].click();
      }
    }, 'button[type="submit"]')


    await delay(500);

    // Вводим логин
    await typeText(page, USERNAME_SELECTOR, options.login);

    // Вводим пароль
    await typeText(page, PASSWORD_SELECTOR, options.password);

    // Жмем "Запомнить меня"
    if (options.rememberMe) {
      await page.click(REMEMBER_ME_SELECTOR);
    }

    // Жмем "Войти"
    await page.click(SIGN_IN_SELECTOR);
    await page.waitForSelector('#header-menu', {
      visible: true,
      timeout: 300000
    });

    this._cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(this._cookies));

    return page;
  };

  async feed(options: {
    isDebug?: boolean | string,
    fromDate?: string,
    toDate?: string,
    cookies: Cookie[]
  }) {

    if (!this._browser) {
      this._browser = await createBrowser(options.isDebug as boolean);
    }

    const page = await createPage(this._browser, true);

    if (options.cookies) {
      await page.setCookie(...options.cookies);
    }

    // Откроем новую страницу
    await tryNavigate(page, 'https://www.lowadi.com/elevage/chevaux/?elevage=all-horses');
    await page.waitForSelector('#horseList a.horsename', {
      visible: true,
      timeout: 5000
    });

    const hrefs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#horseList .damier-cell'))
        .filter(cell => !cell.querySelector('[data-tooltip="Спит"]') && cell.querySelector('a.horsename'))
        // @ts-ignore
        .map(cell => cell.querySelector('a.horsename').href);
    });

    for (let i = 0; i < hrefs.length; i++) {
      try {
        // @ts-ignore
        await tryNavigate(page, hrefs[i]);

        if (await isExist(page, '#Ufo_0', 1000)) {
          await page.click('#Ufo_0');
          await delay(1000);
          await page.click('#ufoBoxContent button');
          await delay(1000);
          console.log("Получен подарочек!")
        }

        if (await isExist(page, '#boutonMissionMontagne', 1000)) {
          await page.click('#boutonMissionMontagne');
          console.log("Транспортировать железо")
        }

        if (await isExist(page, '#boutonMissionEquus', 1000)) {
          await page.click('#boutonMissionEquus');
          console.log("Урок")
        }

        if (await isExist(page, '#boutonMissionForet', 1000)) {
          await page.click('#boutonMissionForet');
          console.log("Заготовка леса")
        }

        // Регистрация на Конноспортивный комплекс
        if (await isExist(page, '#cheval-inscription a', 1000)) {
          console.log("Регистрация на Конноспортивный комплекс")
          // Переходим на "Записать лошадь на пансион"
          await page.click('#cheval-inscription a');
          await page.waitForSelector('#table-0', {
            visible: true,
            timeout: 5000
          })

          // Выбирает самый дешевый
          const cskPrice = await page.evaluate(() => {
            var table = document.querySelector('#table-0');

            var result = {};

            // 30 дней
            Array.from(table.querySelectorAll('tbody td'))
              .filter((td, index) => index === 8 || index % 11 === 8)
              .filter(td => td.querySelector('button:not(.disabled)'))
              .map(td => td.querySelector('button'))
              // @ts-ignore
              .forEach(curr => result[+curr.textContent.replace(/ /g, '')] = curr);

            if (Object.entries(result)[0]) {
              // @ts-ignore
              Object.entries(result)[0][1].click();
              return Object.entries(result)[0][0];
            } else {
              // 10 дней
              Array.from(table.querySelectorAll('tbody td'))
                .filter((td, index) => index === 7 || index % 11 === 7)
                .filter(td => td.querySelector('button:not(.disabled)'))
                .map(td => td.querySelector('button'))
                // @ts-ignore
                .forEach(curr => result[+curr.textContent.replace(/ /g, '')] = curr);
              if (Object.entries(result)[0]) {
                // @ts-ignore
                Object.entries(result)[0][1].click();
                return Object.entries(result)[0][0];
              } else {
                // 3 дня
                Array.from(table.querySelectorAll('tbody td'))
                  .filter((td, index) => index === 6 || index % 11 === 6)
                  .filter(td => td.querySelector('button:not(.disabled)'))
                  .map(td => td.querySelector('button'))
                  // @ts-ignore
                  .forEach(curr => result[+curr.textContent.replace(/ /g, '')] = curr);
                if (Object.entries(result)[0]) {
                  // @ts-ignore
                  Object.entries(result)[0][1].click();
                  return Object.entries(result)[0][0];
                } else {
                  return false;
                }
              }
            }

            return true;
          });

          if (!cskPrice) {
            console.log("Не хватило денег")
            continue;
          } else {
            console.log(`Цена за Конноспортивный комплекс: ${cskPrice}`);
          }

          await page.waitForSelector('#boutonCaresser', {
            visible: true,
            timeout: 300000
          });
        }

        const isSleeping = await page.evaluate(() => {
          return document.getElementById('boutonCoucher') && document.getElementById('boutonCoucher').classList.contains('action-disabled');
        });

        if (isSleeping) {
          console.log("Лошадь спит")
          continue;
        }

        await delay(1000);

        // ласкать
        await page.click('#boutonCaresser')
        console.log("Обласкан")

        // чистить
        await page.click('#boutonPanser')
        console.log("Почистили")

        try {
          // кормить
          if (await isExist(page, '#boutonAllaiter', 1000)) {
            await page.click('#boutonAllaiter')
            await page.waitForSelector('#boutonNourrir', {
              visible: true,
              timeout: 1000
            })
            console.log("Покормлен")
          }

          // кормить
          if (await isExist(page, '#boutonNourrir', 1000)) {
            await page.click('#boutonNourrir')
            const maxFeedingHay = await page.evaluate(() => {
              return +document.querySelector('.section-fourrage.section-fourrage-target')?.textContent;
            });
            if (maxFeedingHay) {
              await page.select('#feedingHay', `${maxFeedingHay - 2}`);
            }
            if (await isExist(page, '#feedingOats', 1000)) {
              await page.select('#feedingOats', '2');
            }
            await page.click('#feed-button')
            await page.waitForSelector('#boutonNourrir', {
              visible: true,
              timeout: 1000
            })

            console.log("Покормлен")
          }
        } catch (e) {

        }

        // Спать
        await page.click('#boutonCoucher')
        console.log("Отправлен спать")

        await delay(1000);
      } catch (e) {

      }
    }

    await page.close();
  }
}


