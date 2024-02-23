import * as puppeteer from "puppeteer";
import { Browser, Page } from "puppeteer";
import '../utils/puppeteer-extension';
import { createBrowser, createPage, isExist, tryNavigate, typeText } from "../utils/puppeteer-extension";
import { Cookie } from "puppeteer";
import { FlProjectModel } from "../fl.ru/fl-project-model";

const MAX_PAGES = 5;
const pages = [];

export class HhService {

  private _cookies: Cookie[] = [];
  private _browser: Browser;

  constructor() {
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
   * Парсим страницу где есть список проектов
   * @param page Страница с проектами
   * @private
   */
  private _parseProjectsList(page: Page): Promise<FlProjectModel[]> {
    return page.evaluate(() => {
      const projects = Array.from(document.querySelectorAll('#projects-list [id^="project-item"]'));
      const ids = projects.map((e: HTMLElement) => +e.id.replace('project-item', ''));
      return ids
        .map(id => ({
          id: id,
          title: document.querySelector(`#prj_name_${id}`)?.textContent,
          createDate: document.querySelector(`#prj_name_${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2)`)?.textContent,
          views: +document.querySelector(`#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > span.b-post__txt.b-post__txt_float_right.b-post__txt_fontsize_11.b-post__txt_bold.b-post__link_margtop_7`)
            ?.textContent
            .trim()
          ,
          alreadyApplied: document.querySelector(`#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > a:nth-child(3)`)
            ?.textContent
            .trim().includes('ответ'),
          proposalCount: +document.querySelector(`#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > a`)
            ?.textContent
            .replace(/[^\x20-\x7E]/g, '')
            .trim(),
          link: `https://www.fl.ru${document.querySelector(`#prj_name_${id}`)?.getAttribute('href')}`,
          description: document.querySelector(`#project-item${id} > div.b-post__body.b-post__body_padtop_15.b-post__body_overflow_hidden.b-layuot_width_full > div.b-post__txt`)
            ?.textContent
            ?.trimLeft()
            .trimRight(),
          price: +document.querySelector(`#project-item${id} > div.b-post__price.b-layout__txt_right.b-post__price_padleft_10.b-post__price_padbot_5.b-post__price_float_right.b-post__price_fontsize_15.b-post__price_bold`)
            ?.textContent
            .replace(/[^\x20-\x7E]/g, '')
            .trim(),
        }) as FlProjectModel);
    });
  }

  /**
   * Получение информации по проекту
   * @param projectId Идентификатор проекта
   * @param options
   */
  async getProjectDetailsById(projectId: string | number, options: {
    cookies: Cookie[],
    isDebug?: boolean
  }) {
    if (!this._browser) {
      this._browser = await createBrowser(options.isDebug);
    }

    const page = await createPage(this._browser, true);

    if (options && options.cookies) {
      await page.setCookie(...options.cookies);
    }

    // Откроем новую страницу
    await tryNavigate(page, `https://www.fl.ru/projects/${projectId}/`);

    // Если на проекте уже откликались
    if (await isExist(page, '[id^="po_dialogue_talk_"]')) {
      await page.click('[id^="toggle_dialogue_"]');

      await page.waitForSelector('[id^="po_dialogue_talk_"]', {
        visible: true
      });
    }

    return page.evaluate(() => {
      const dialogueTalk = document.querySelector(`[id^="po_dialogue_talk_"]`);
      const messages = dialogueTalk.querySelectorAll(`#po_dialogue_talk_60990309 > div`);

      return {
        messages: Array.from(messages).map(message => ({
          user: {
            url: message.querySelector(`span:first-child > a`)?.getAttribute('href') ? `https://www.fl.ru${message.querySelector(`span:first-child > a`)?.getAttribute('href')}` : undefined,
            name: message.querySelector(`span:first-child > a`)?.textContent ? message.querySelector(`span:first-child > a`)?.textContent : message.querySelector(`span:first-child`)?.textContent
          },
          createDate: message.querySelector(`[id^="po_date_"]`)?.textContent,
          text: message.querySelector(`[id^="po_comment_"]`)?.textContent?.replace('<br>', '\n').trimLeft()
        }))
      };
    });
  }

  async sendProposalToProject(projectId: string | number, options: {
    isDebug?: boolean | string,
    proposalDescription: string,
    timeFrom: number,
    costFrom: number,
    cookies: Cookie[]
  }) {

//         options.proposalDescription = `Привет.
// Я заинтересовался Вашим предложением и уже готов к работе.
//
// Резюме:
// - Работаю лидером команды в компании Wildberries.ru – лидер рынка онлайн ритейла в России;
// - В моем распоряжении 6 фронтенд разработчиков;
// - Более 4 лет разрабатываю CRM и ERP системы;
// - Более 3 лет использую Ангуляр, Typescript, RXJS;
// - 2 года работы Fullstack разработчиком с использованием на бэкенде технологий ASP.NET Core, MS  SQL, AWS, Docker, Kubernetes;
// - Бизнес-ориентирован, умею составлять четкое техническое задание по требованиям заказчика, вести задачи в трекере задач, таких как Jira, Youtrack, Trello.
//
// Подробнее обо мне тут:
// https://www.linkedin.com/in/maksim-zakharov-977179104/
//
// Стоимость моей работы от 1277/час.
//
// Также могу добавить к работе опытную команду разработчиков уровня Middle +.
//
// Если вас заинтересует моя кандидатура, можем обсудить детали сотрудничества здесь, или по следующим контактам:
//
// Емайл: max89701@gmail.com
// Телеграмм: @max89701 (предпочтительно)
// WhatsApp: +79254306274`;

    if (!options.proposalDescription || options.proposalDescription.length < 5) {
      throw new Error('Длина описания должна быть не менее 5 символов');
    }

    if (!options.timeFrom) {
      throw new Error('Необходимо указать минимальные сроки');
    }

    if (!options.costFrom) {
      throw new Error('Необходимо указать минимальную стоимость');
    }

    // TODO Использовать https://hackernoon.com/tips-and-tricks-for-web-scraping-with-puppeteer-ed391a63d952
    if (!this._browser) {
      this._browser = await createBrowser(options.isDebug as boolean);
    }

    const page = await createPage(this._browser, true);

    if (options && options.cookies) {
      await page.setCookie(...options.cookies);
    }

    const TIME_FROM_SELECTOR = '#el-time_from';
    const CONST_FROM_SELECTOR = '#el-cost_from';
    const PROPOSAL_DESCRIPTION_SELECTOR = '#el-descr';
    const SEND_PROPOSAL_SELECTOR = '#quickPaymentPopupOfferOptOnPage > div.b-buttons > button';
    const REJECT_PROPOSAL_SELECTOR = '#frl_edit_bar > a.b-layout__link.b-layout__link_float_right.b-layout__link_color_ee1d16.b-layout__link_bold';
    const ALREADY_REJECTED_SELECTOR = 'body > div.b-page__wrapper > div > div.b-layout.b-layout__page > div > div > div.b-layout.b-layout_margright_270.b-layout_marg_null_ipad > div.b-layout.b-layout_2bordbot_dfdfdf0.b-layout_margbot_20 > div.b-layout.b-layout_padleft_60.b-layout_padbot_20.b-layout_pad_null_ipad > div.b-layout > div.po_refused';
    const ALREADY_HAVE_EXECUTOR_SELECTOR = `#project_status_${projectId}`;

    await tryNavigate(page, `https://www.fl.ru/projects/${projectId}`);

    // Если на проект уже откликались
    if (await isExist(page, REJECT_PROPOSAL_SELECTOR)) {
      throw new Error(`На проект ${projectId} уже есть отклик.`);
      // console.log(`На проект ${projectId} уже есть отклик.`);
      // await page.close();
      // return;
    }

    // Если на проект уже откликались
    if (await isExist(page, ALREADY_HAVE_EXECUTOR_SELECTOR)) {
      throw new Error(`На проект ${projectId} уже выбран исполнитель.`);
      // console.log(`На проект ${projectId} уже выбран исполнитель.`);
      // await page.close();
      // return;
    }

    // Если от проекта уже отказались
    if (await isExist(page, ALREADY_REJECTED_SELECTOR) || !await isExist(page, PROPOSAL_DESCRIPTION_SELECTOR)) {
      throw new Error(`Вы уже отказались от проекта ${projectId}.`);
      // console.log(`Вы уже отказались от проекта ${projectId}.`);
      // await page.close();
      // return;
    }

    if (options.proposalDescription) {
      await typeText(page, PROPOSAL_DESCRIPTION_SELECTOR, options.proposalDescription);
    }

    if (options.timeFrom) {
      await typeText(page, TIME_FROM_SELECTOR, options.timeFrom.toString());
    }

    if (options.costFrom) {
      await typeText(page, CONST_FROM_SELECTOR, options.costFrom.toString());
    }

    if (await isExist(page, SEND_PROPOSAL_SELECTOR)) {
      await page.click(SEND_PROPOSAL_SELECTOR);
    }

    await page.close();
  }

  /**
   * Возвращает все проекты с сайта https://fl.ru по заданным фильтрам
   * @param search Объект с фильтрами
   */
  getResumes = async (search: { words: string | string[] | any, minBudget?: number, isDebug?: boolean, maxBudget?: number, withoutContractor?: boolean, cookies?: Cookie[] }): Promise<{ items?: FlProjectModel[], length?: number, error?: string }> => {

    try {
      // TODO Использовать https://hackernoon.com/tips-and-tricks-for-web-scraping-with-puppeteer-ed391a63d952
      if (!this._browser) {
        this._browser = await createBrowser(search.isDebug);
      }
      let pageUrl = 'https://hh.ru/search/resume';
      let text = '(CJM OR FIGMA OR CUSDEV OR "CUSTOMER DEVELOPMENT") and "product manager"';
      let experience = '';// 'between1And3';
      let employment = '';// 'full';
      let schedule = ''; // 'fullDay';

      pageUrl += `?employment=full&clusters=True&area=1&specialization=1&order_by=relevance&items_on_page=100&search_period=30&age_from=24&age_to=35&salary_from=200000&logic=normal&pos=full_text&exp_period=all_time&exp_company_size=any&exp_industry=any&label=only_with_photo&experience=between3And6&experience=moreThan6&no_magic=False&ored_clusters=True&st=resumeSearch&text=${text}`;

      const page = await createPage(this._browser, true);
      await tryNavigate(page, pageUrl);

      let totalPages = await page.evaluate(() => {
        // @ts-ignore
        return +document.querySelector("#HH-React-Root > div > div > div > div.resume-serp > div.bloko-column.bloko-column_s-8.bloko-column_m-9.bloko-column_l-13 > div > div.bloko-gap.bloko-gap_top > div > span.pager-item-not-in-short-range > span.pager-item-not-in-short-range")?.textContent || 1
      });

      console.log(`Всего страниц: ${totalPages}`);

      let skills = [];
      for (let pageIndex = 0; pageIndex < +totalPages; pageIndex++) {
        console.log(`${new Date().toLocaleString()}: Скрабим страницу ${pageIndex}`);
        if (pageIndex) {
          await tryNavigate(page, pageUrl += `&page=${pageIndex}`);
        }

        let vacancyIds = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("[data-qa='resume-serp__resume-title']")).map(vacancy => {
            // @ts-ignore
            return vacancy.href.split('?')[0].split('/').slice(-1).join('');
          })
        });
        const temp = [];

        try {
          // @ts-ignore
          for (let i = 0; i < vacancyIds.length; i += MAX_PAGES) {
            const ids = vacancyIds.splice(i, MAX_PAGES);
            temp.push([ids]);
          }
        } catch (e) {

        }
        const skillArrays = [];
        try {
          for (let i = 0; i < temp.length; i++) {
            for (let j = 0; j < temp[i].length; j++) {
              let newSkills = await Promise.all(temp[i][j].map(vacancy => this._getSkillsByResumeId(vacancy)));
              skillArrays.push(...newSkills);
            }
          }
        } catch (e) {

        }

        skills = [...skills, ...skillArrays];
      }

      const temp1 = skills
        .reduce((acc, curr) => [...acc, ...curr], [])
        .map(i => i.toLowerCase())
        .reduce((acc, curr) => !acc.has(curr) ? acc.set(curr, 1) : acc.set(curr, acc.get(curr) + 1), new Map())
        .entries()
      ;

      // skills = skills.entries();

      const temp2 = Array.from(temp1).sort(function (a, b) {
        if (a[1] > b[1]) {
          return -1;
        }
        if (a[1] < b[1]) {
          return 1;
        }
        // a должно быть равным b
        return 0;
      });

      console.log(temp2.slice(0, 20));
      return {
        // items: items,
        // length: items.length
      };
    } catch (e) {
      console.error(e.message);
      console.log(`${new Date().toLocaleString()}: Ошибочка`);
      return {
        error: e.message
      }
    } finally {
    }
  };


  /**
   * Возвращает все проекты с сайта https://fl.ru по заданным фильтрам
   * @param search Объект с фильтрами
   */
  getVacancies = async (search: { words: string | string[] | any, minBudget?: number, isDebug?: boolean | string, maxBudget?: number, withoutContractor?: boolean, cookies?: Cookie[] }): Promise<{ items?: FlProjectModel[], length?: number, error?: string }> => {

    try {
      // TODO Использовать https://hackernoon.com/tips-and-tricks-for-web-scraping-with-puppeteer-ed391a63d952
      if (!this._browser) {
        this._browser = await createBrowser();
      }
      let pageUrl = 'https://hh.ru/search/vacancy';
      let text = 'angular';
      let experience = '';// 'between1And3';
      let employment = '';// 'full';
      let schedule = ''; // 'fullDay';

      pageUrl += `?text=${text}&experience=${experience}&employment=${employment}&schedule=${schedule}`;

      const page = await createPage(this._browser, true);
      await tryNavigate(page, pageUrl);

      let totalPages = await page.evaluate(() => {
        // @ts-ignore
        return +Array.from(document.querySelectorAll("[data-page]")).splice(-2).map(p => p.innerText)[0]
      });

      console.log(`Всего страниц: ${totalPages}`);

      let skills = [];
      for (let pageIndex = 0; pageIndex < +totalPages; pageIndex++) {
        console.log(`${new Date().toLocaleString()}: Скрабим страницу ${pageIndex}`);
        if (pageIndex) {
          await tryNavigate(page, pageUrl += `&page=${pageIndex}`);
        }

        let vacancyIds = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("[data-qa='vacancy-serp__vacancy-title']")).map(vacancy => {
            // @ts-ignore
            return vacancy.href.split('?')[0].split('/').slice(-1).join('');
          })
        });
        const temp = [];

        try {
          // @ts-ignore
          for (let i = 0; i < vacancyIds.length; i += MAX_PAGES) {
            const ids = vacancyIds.splice(i, MAX_PAGES);
            temp.push([ids]);
          }
        } catch (e) {

        }
        const skillArrays = [];
        try {
          for (let i = 0; i < temp.length; i++) {
            for (let j = 0; j < temp[i].length; j++) {
              let newSkills = await Promise.all(temp[i][j].map(vacancy => this._getSkillsByVacancyId(vacancy)));
              skillArrays.push(...newSkills);
            }
          }
        } catch (e) {

        }

        skills = [...skills, ...skillArrays];
      }

      const temp1 = skills
        .reduce((acc, curr) => [...acc, ...curr], [])
        .map(i => i.toLowerCase())
        .reduce((acc, curr) => !acc.has(curr) ? acc.set(curr, 1) : acc.set(curr, acc.get(curr) + 1), new Map())
        .entries()
      ;

      // skills = skills.entries();

      const temp2 = Array.from(temp1).sort(function (a, b) {
        if (a[1] > b[1]) {
          return -1;
        }
        if (a[1] < b[1]) {
          return 1;
        }
        // a должно быть равным b
        return 0;
      });

      console.log(temp2.slice(0, 20));
      return {
        // items: items,
        // length: items.length
      };
    } catch (e) {
      console.error(e.message);
      console.log(`${new Date().toLocaleString()}: Ошибочка`);
      return {
        error: e.message
      }
    } finally {
    }
  };

  private async _getSkillsByResumeId(vacancyId: string): Promise<string[]> {
    const page = await createPage(this._browser, true);
    // let obj;
    // if (pages.length < MAX_PAGES) {
    //   pages.push({page: await createPage(this._browser, true), free: true});
    // } else {
    //   obj = pages.find(i => i.free);
    //   obj.free = false;
    // }
    await tryNavigate(page, `https://krasnodar.hh.ru/resume/${vacancyId}`);
    const result = await page.evaluate(() => {
      // @ts-ignore
      return Array.from(document.querySelectorAll("[data-qa='bloko-tag__text']")).map(b => b.innerText)
    });

    setTimeout(() => page.close(), 5000);

    // obj.free = true;

    return result;
  }

  private async _getSkillsByVacancyId(vacancyId: string): Promise<string[]> {
    const page = await createPage(this._browser, true);
    // let obj;
    // if (pages.length < MAX_PAGES) {
    //   pages.push({page: await createPage(this._browser, true), free: true});
    // } else {
    //   obj = pages.find(i => i.free);
    //   obj.free = false;
    // }
    await tryNavigate(page, `https://krasnodar.hh.ru/vacancy/${vacancyId}`);
    const result = await page.evaluate(() => {
      // @ts-ignore
      return Array.from(document.querySelectorAll("[data-qa='bloko-tag__text']")).map(b => b.innerText)
    });

    setTimeout(() => page.close(), 5000);

    // obj.free = true;

    return result;
  }
}


