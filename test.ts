import * as puppeteer from "puppeteer";
import {Browser, Page} from "puppeteer";

export class FLService {

    _browser: Browser;

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

    getProjects = async (...words) => {
        try {
            console.log(`${new Date().toLocaleString()}: Начало скраббинга`);
            this._browser = await puppeteer.launch();

            let projects = [];

            await Promise.all(words.map(async (word) => {
                const page = await this._browser.newPage();
                console.log(`${new Date().toLocaleString()}: Переходим на страницу проектов`);
                await page.goto('https://www.fl.ru/projects/');
                console.log(`${new Date().toLocaleString()}: Меняем фильтрацию на Angular`);
                await page.focus('#pf_keywords');
                await page.keyboard.type(word);
                await page.click('#frm > div.b-layout.b-layout_overflow_hidden > div > button');
                await page.waitForSelector('#projects-list [id^="project-item"] > div.b-post__body.b-post__body_padtop_15.b-post__body_overflow_hidden.b-layuot_width_full > div.b-post__txt', {
                    visible: true
                });
                console.log(`${new Date().toLocaleString()}: Пытаемся распарсить список`);
                const result = await page.evaluate(() => {
                    const projects = Array.from(document.querySelectorAll('#projects-list [id^="project-item"]'));
                    const ids = projects.map((e: HTMLElement) => +e.id.replace('project-item', ''));
                    return ids
                        .map(id => ({
                            id: id,
                            title: document.querySelector(`#prj_name_${id}`)?.textContent,
                            link: document.querySelector(`#prj_name_${id}`)?.getAttribute('href'),
                            description: document.querySelector(`#project-item${id} > div.b-post__body.b-post__body_padtop_15.b-post__body_overflow_hidden.b-layuot_width_full > div.b-post__txt`)?.textContent?.trimLeft().trimRight(),
                            price: +document.querySelector(`#project-item${id} > div.b-post__price.b-layout__txt_right.b-post__price_padleft_10.b-post__price_padbot_5.b-post__price_float_right.b-post__price_fontsize_15.b-post__price_bold`)?.textContent
                                .replace(/[^\x20-\x7E]/g, '').trim(),
                        }));
                });
                console.log(`${new Date().toLocaleString()}: Распарсили`);
                projects.push(result);
            }));
            return this.distinct<any>(this.selectMany(projects, i => i), i => i.id);
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


