import {Browser, Page, ResourceType} from "puppeteer";

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

        await page.goto(pageUrl, {
            // waitUntil: "domcontentloaded",
            // timeout: 10000

            timeout: 25000,
            waitUntil: 'networkidle2',
        }); // При domcontentloaded не дожидаемся загрузки фоток и стилей
    } catch (error) {
        console.log(`${new Date().toLocaleString()}: Не удалось открыть страницу: ${pageUrl} из-за ошибки: ${error}`);
    }
};

export const createPage = async (browser: Browser, withoutAssets?: boolean): Promise<Page> => {
    const page = await browser.newPage();
    if (withoutAssets) {
        const blockedResourceTypes = [
        'image',
        'media',
        'font',
        'texttrack',
        'object',
        'beacon',
        'csp_report',
        'imageset',
    ];

        const skippedResources = [
            'quantserve',
            'adzerk',
            'doubleclick',
            'adition',
            'exelator',
            'sharethrough',
            'cdn.api.twitter',
            'google-analytics',
            'googletagmanager',
            'google',
            'fontawesome',
            'facebook',
            'analytics',
            'optimizely',
            'clicktale',
            'mixpanel',
            'zedo',
            'clicksor',
            'mc.yandex.ru',
            '.mail.ru',
            'tiqcdn',
        ];
        try {
            await page.setRequestInterception(true);
            page.on('request', request => {
                const requestUrl = request.url().split('?')[0].split('#')[0];
                if (
                    blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
                    skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
                    // Be careful with above
                    || request.url().includes('.jpg')
                    || request.url().includes('.jpeg')
                    || request.url().includes('.png')
                    || request.url().includes('.gif')
                    || request.url().includes('.css')
                )
                    request.abort();
                else
                    request.continue();
            });
        } catch (e) {

        }
    }
    return page;
};
