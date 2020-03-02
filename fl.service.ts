import * as puppeteer from "puppeteer";
import {Browser, Page} from "puppeteer";
import './puppeteer-extension';
import {createBrowser, createPage, isExist, tryNavigate, typeText} from "./puppeteer-extension";
import {Cookie} from "puppeteer";
import {FlProjectModel} from "./fl-project-model";

export class FlService {

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

    loginUpwork = async (options: { login: string, password: string, rememberMe?: boolean, isDebug?: boolean | string }) => {

        const USERNAME_SELECTOR = '#login_username';
        const CHECK_USERNAME_SELECTOR = '#main-auth-card > form > div.ng-animate-disabled.p-xs-top.auth-growable-flex > div > div > button';
        const PASSWORD_SELECTOR = '#login_password';
        const REMEMBER_ME_SELECTOR = '#main-auth-card > form > div:nth-child(4) > div > div > div:nth-child(7) > div.pull-left.d-none-mobile-app > div > label';
        const SIGN_IN_SELECTOR = '#main-auth-card > form > div:nth-child(4) > div > div > button';

        if (!this._browser) {
            this._browser = await createBrowser(options.isDebug as boolean);
        }

        const page = await createPage(this._browser, true);

        // if (this._cookies) {
        //     await page.setCookie(...this._cookies);
        //     return;
        // }

        // Откроем новую страницу
        await tryNavigate(page, 'https://www.upwork.com/ab/account-security/login');

        // Вводим логин
        await typeText(page, USERNAME_SELECTOR, options.login);
        await page.click(CHECK_USERNAME_SELECTOR);
        await page.waitForSelector('#projects-list', {
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
        await page.waitForSelector('#feed-jobs > section:nth-child(1) > div > div > div > div.clearfix.ng-scope > h4 > a', {
            visible: true
        });

        console.log("ЛОГИН В АПВОРК ЗАВЕРШЕН!");
    };

    /**
     * Авторизовывается на странице и возвращает страницу с кукисами
     * @param options
     */
    login = async (options: { login: string, password: string, rememberMe?: boolean, isDebug?: boolean | string }): Promise<Page> => {

        const USERNAME_SELECTOR = '#el-login';
        const PASSWORD_SELECTOR = '#el-passwd';
        const REMEMBER_ME_SELECTOR = '#el-autologin';
        const SIGN_IN_SELECTOR = '#el-singin';

        if (!this._browser) {
            this._browser = await createBrowser(options.isDebug as boolean);
        }

        const page = await createPage(this._browser, true);

        if (this._cookies.length) {
            await page.setCookie(...this._cookies);
            return;
        }

        // Откроем новую страницу
        await tryNavigate(page, 'https://www.fl.ru/login/');

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
        await page.waitForSelector('#projects-list', {
            visible: true
        });

        this._cookies = await page.cookies();

        return page;
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

    async sendProposalToProject(projectId: string | number, options?: {
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
    getProjects = async (search: { words: string | string[] | any, minBudget?: number, isDebug?: boolean | string, maxBudget?: number, withoutContractor?: boolean, cookies?: Cookie[] }): Promise<{ items?: FlProjectModel[], length?: number, error?: string }> => {

        try {
            if (!search) {
                throw new Error('Нужно передать параметры для поиска');
            }

            if (!search.words || !search.words.length) {
                throw new Error('Нужно передать ключевые слова для поиска');
            }

            if (typeof search.words === 'string') {
                search.words = [search.words];
            }

            const KEYWORDS_SELECTOR = '#pf_keywords';
            const COST_FROM_SELECTOR = '#pf_cost_from';
            const COST_TO_SELECTOR = '#pf_cost_to';
            const HIDE_EXECUTOR_SELECTOR = '#for-hide_exec';
            const SUBMIT_FILTER_BUTTON_SELECTOR = '#frm > div.b-layout.b-layout_overflow_hidden > div > button';
            const NOT_FOUND_SELECTOR = 'body > div.b-page__wrapper > div > div.b-layout.b-layout__page > div > div > table > tbody > tr > td.b-layout__td.b-layout__td_padleft_50.b-layout__td_bordleft_c3.b-layout__td_valign_mid.b-layout__td_pad_null_ipad.b-layout__td_bord_null_ipad > div.b-buttons > a';

            console.log(`${new Date().toLocaleString()}: Начало скраббинга`);

            // TODO Использовать https://hackernoon.com/tips-and-tricks-for-web-scraping-with-puppeteer-ed391a63d952
            if (!this._browser) {
                this._browser = await createBrowser(search.isDebug as boolean);
            }

            let projects = await Promise.all(search.words.map(async (word) => {
                    const page = await createPage(this._browser, true);

                    if (search.cookies) {
                        await page.setCookie(...search.cookies);
                    }

                    await tryNavigate(page, 'https://www.fl.ru/projects/');
                    console.log(`${new Date().toLocaleString()}: Меняем фильтрацию на ${word}`);

                    await typeText(page, KEYWORDS_SELECTOR, word);

                    if (search.minBudget) {
                        await typeText(page, COST_FROM_SELECTOR, search.minBudget.toString());
                    }

                    if (search.maxBudget) {
                        await typeText(page, COST_TO_SELECTOR, search.maxBudget.toString());
                    }

                    if (search.withoutContractor) {
                        await page.click(HIDE_EXECUTOR_SELECTOR);
                    }

                    await page.click(SUBMIT_FILTER_BUTTON_SELECTOR);
                    await page.waitForSelector('#projects-list [id^="project-item"]', {
                        visible: true
                    });
                    console.log(`${new Date().toLocaleString()}: Пытаемся распарсить список`);

                    let pageCount = 1;

                    let filteredProjects = await this._parseProjectsList(page);
                    console.log(`${new Date().toLocaleString()}: Распарсили страницу ${pageCount++}`);

                    try {
                        // Выход из цикла осуществляется прокидыванием ошибки waitForSelector
                        while (true) {
                            await tryNavigate(page, `https://www.fl.ru/projects/?page=${pageCount}&kind=5`, false);

                            if (await isExist(page, NOT_FOUND_SELECTOR)) {
                                console.log(`${new Date().toLocaleString()}: Больше нет страниц`);
                                await page.close();
                                break;
                            }

                            await page.waitForSelector('#projects-list [id^="project-item"]', {
                                visible: true
                            });

                            const result = await this._parseProjectsList(page);
                            console.log(`${new Date().toLocaleString()}: Распарсили страницу ${pageCount++}`);
                            filteredProjects = [...filteredProjects, ...result];
                        }
                    } catch (e) {
                        console.log(`${new Date().toLocaleString()}: Больше нет страниц`);
                        await page.close();
                    }

                    return filteredProjects;
                }
            ));
            const items = this.distinct<any>(this.selectMany(projects, i => i), i => i.id);
            return {
                items: items,
                length: items.length
            };
        } catch (e) {
            console.log(`${new Date().toLocaleString()}: Ошибочка`);
            return {
                error: e.message
            }
        } finally {
        }
    };
}


