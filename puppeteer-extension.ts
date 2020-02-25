import {Page} from "puppeteer";

/**
 * Набор текста в предварительно очищенную строку
 * @param page Страница с текстовым полем
 * @param selector Селектор текстового поля
 * @param text Текст который нужно набрать
 */
export const typeText = async (page: Page, selector: string, text: string): Promise<void> => {
    await page.waitForSelector(selector, {timeout: 5000});
    await page.$eval(selector, (el: HTMLInputElement) => el.value = '');
    return page.type(selector, text);
};

/**
 * Переход по ссылке
 * @param page Страница для перехода
 * @param pageUrl Ссылка для перехода
 */
export const tryNavigate = async (page: Page, pageUrl: string): Promise<void> => {
    try {
        // Попробуем перейти по URL
        console.log(`${new Date().toLocaleString()}: Открываю страницу: ${pageUrl}`);

        if (page.url() === pageUrl) {
            return;
        }

        await page.goto(pageUrl, {waitUntil: "domcontentloaded", timeout: 0}); // При domcontentloaded не дожидаемся загрузки фоток и стилей
    } catch (error) {
        console.log(`${new Date().toLocaleString()}: Не удалось открыть страницу: ${pageUrl} из-за ошибки: ${error}`);
    }
};
