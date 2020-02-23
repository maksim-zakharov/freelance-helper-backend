import * as puppeteer from "puppeteer";
import {Browser} from "puppeteer";

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

    getProjects = async (search: { words: string[], minBudget?: number, maxBudget?: number, withoutContractor?: boolean }) => {
        if (!search) {
            throw new Error('Нужно передать параметры для поиска');
        }
        try {
            if (!search.words || !search.words.length) {
                throw new Error('Нужно передать ключевые слова для поиска');
            }

            console.log(`${new Date().toLocaleString()}: Начало скраббинга`);
            this._browser = await puppeteer.launch();

            let projects = [];

            await Promise.all(search.words.map(async (word) => {
                const page = await this._browser.newPage();
                console.log(`${new Date().toLocaleString()}: Переходим на страницу проектов`);
                await page.goto('https://www.fl.ru/projects/');
                console.log(`${new Date().toLocaleString()}: Меняем фильтрацию на Angular`);

                await page.focus('#pf_keywords');
                await page.keyboard.type(word);

                if (search.minBudget) {
                    await page.focus('#pf_cost_from');
                    await page.keyboard.type(search.minBudget.toString());
                }

                if (search.maxBudget) {
                    await page.focus('#pf_cost_to');
                    await page.keyboard.type(search.maxBudget.toString());
                }

                if (search.withoutContractor) {
                    await page.click('#for-hide_exec');
                }

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
                            createDate: document.querySelector(`#prj_name_${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2)`)?.textContent,
                            views: +document.querySelector(`#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > span.b-post__txt.b-post__txt_float_right.b-post__txt_fontsize_11.b-post__txt_bold.b-post__link_margtop_7`)
                                ?.textContent
                                .trim()
                            ,
                            proposalCount: +document.querySelector(`#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > a`)
                                ?.textContent
                                .replace(/[^\x20-\x7E]/g, '').trim(),
                            link: document.querySelector(`#prj_name_${id}`)?.getAttribute('href'),
                            description: document.querySelector(`#project-item${id} > div.b-post__body.b-post__body_padtop_15.b-post__body_overflow_hidden.b-layuot_width_full > div.b-post__txt`)?.textContent?.trimLeft().trimRight(),
                            price: +document.querySelector(`#project-item${id} > div.b-post__price.b-layout__txt_right.b-post__price_padleft_10.b-post__price_padbot_5.b-post__price_float_right.b-post__price_fontsize_15.b-post__price_bold`)?.textContent
                                .replace(/[^\x20-\x7E]/g, '').trim(),
                        }));
                });
                console.log(`${new Date().toLocaleString()}: Распарсили`);
                projects.push(result);
            }));
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


