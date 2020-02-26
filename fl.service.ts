import * as puppeteer from "puppeteer";
import {Browser, Page} from "puppeteer";
import './puppeteer-extension';
import {createPage, tryNavigate, typeText} from "./puppeteer-extension";

export class FlService {

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
     * Авторизовывается на странице и возвращает страницу с кукисами
     * @param model
     */
    login = async (model: { login: string, password: string, rememberMe?: boolean, isDebug?: boolean | string }): Promise<Page> => {
        const browser = await puppeteer.launch({
            headless: model.isDebug != 'true',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        });

        const page = await createPage(browser, true);

        // Откроем новую страницу
        await tryNavigate(page, 'https://www.fl.ru/login/');

        // Вводим логин
        await typeText(page, '#el-login', model.login);

        // Вводим пароль
        await typeText(page, '#el-passwd', model.password);

        // Жмем "Запомнить меня"
        if (model.rememberMe) {
            await page.click('#el-autologin');
        }

        // Жмем "Войти"
        await page.click('#el-singin');
        await page.waitForSelector('#projects-list', {
            visible: true
        });

        return page;
    }

    private _parseProjectsList(page: Page): Promise<any[]> {
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
                }));
        });
    }

    /**
     * Возвращает все проекты с сайта https://fl.ru по заданным фильтрам
     * @param search Объект с фильтрами
     */
    getProjects = async (search: { words: string[], minBudget?: number, isDebug?: boolean | string, maxBudget?: number, withoutContractor?: boolean, page?: Page }) => {
        if (!search) {
            throw new Error('Нужно передать параметры для поиска');
        }

        try {
            if (!search.words || !search.words.length) {
                throw new Error('Нужно передать ключевые слова для поиска');
            }

            console.log(`${new Date().toLocaleString()}: Начало скраббинга`);

            let projects = await Promise.all(search.words.map(async (word, index) => {
                    // for (let i = 0; i < search.words.length; i++) {
                    //     const word = search.words[i];

                    let browser: Browser;
                    if (!search.page) {
                        browser = await puppeteer.launch({
                            headless: search.isDebug != 'true',
                            args: [
                                '--no-sandbox',
                                '--disable-setuid-sandbox',
                                '--disable-dev-shm-usage',
                                '--disable-accelerated-2d-canvas',
                                '--disable-gpu',
                                '--window-size=1920x1080'
                            ]
                        });
                    } else {
                        browser = search.page.browser();
                    }
                    const page = index === 0 && search.page ? search.page : await createPage(browser, true);

                    if (search.page) {
                        const cookies = await search.page.cookies();
                        await page.setCookie(...cookies);
                    }

                    await tryNavigate(page, 'https://www.fl.ru/projects/');
                    console.log(`${new Date().toLocaleString()}: Меняем фильтрацию на Angular`);

                    await typeText(page, '#pf_keywords', word);

                    if (search.minBudget) {
                        await typeText(page, '#pf_cost_from', search.minBudget.toString());
                    }

                    if (search.maxBudget) {
                        await typeText(page, '#pf_cost_to', search.maxBudget.toString());
                    }

                    if (search.withoutContractor) {
                        await page.click('#for-hide_exec');
                    }

                    await page.click('#frm > div.b-layout.b-layout_overflow_hidden > div > button');
                    await page.waitForSelector('#projects-list [id^="project-item"]', {
                        visible: true,
                        timeout: 1000
                    });
                    console.log(`${new Date().toLocaleString()}: Пытаемся распарсить список`);

                    let pageCount = 1;

                    let filteredProjects = await this._parseProjectsList(page);
                    console.log(`${new Date().toLocaleString()}: Распарсили страницу ${pageCount++}`);

                    try {
                        while (true) {
                            await tryNavigate(page, `https://www.fl.ru/projects/?page=${pageCount}&kind=5`);
                            await page.waitForSelector('#projects-list [id^="project-item"]', {
                                visible: true,
                                timeout: 1000
                            });

                            const result = await this._parseProjectsList(page);
                            console.log(`${new Date().toLocaleString()}: Распарсили страницу ${pageCount++}`);
                            filteredProjects = [...filteredProjects, ...result];
                        }
                    } catch (e) {
                        console.log(`${new Date().toLocaleString()}: Больше нет страниц`);
                    }

                    // await page.close();
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
            // await browser.close();
        }
    };
}


