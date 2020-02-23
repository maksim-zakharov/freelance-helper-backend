// подключение express
import * as express from "express";
import * as compression from 'compression';

import {FlService} from "./fl.service";
import {Page} from "puppeteer";
// создаем объект приложения
const app = express();
app.use(compression());

let service: FlService;
// определяем обработчик для маршрута "/"
app.get("/", async (request, response) => {

    // отправляем ответ
    if (!service) {
        service = new FlService();
    }

    const keywords = request.query['keywords'] as string[];
    if (!keywords?.length) {
        response.send('ОШИБКА');
        return;
    }

    let loginPage: Page;
    if (request.query['login'] && request.query['password']) {
        loginPage = await service.login({login: request.query['login'], password: request.query['password'], isDebug: request.query['isDebug']});
    }

    const result = await service.getProjects({
        page: loginPage,
        words: keywords,
        minBudget: request.query['minBudget'],
        maxBudget: request.query['maxBudget'],
        withoutContractor: true
    });

    response.send(result);
    // response.send("<h2>Привет Express!</h2>");
});
// начинаем прослушивать подключения на 3000 порту
app.listen(3000);
