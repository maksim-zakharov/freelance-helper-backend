// подключение express
import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from 'compression';
import * as fs from 'fs';

import {FlService} from "./fl.service";
import {Cookie, Page} from "puppeteer";
// создаем объект приложения
const app = express();
app.use(compression());
app.use(bodyParser.json());

let service: FlService;

// Отдаем список проектов
app.get("/projects", async (request, response) => {

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
    let cookies: Cookie[];
    const fileData = fs.readFileSync('cookies.json');
    cookies = JSON.parse(fileData.toString()) as Cookie[];
    // if (request.query['login'] && request.query['password']) {
    //     loginPage = await service.login({
    //         login: request.query['login'],
    //         password: request.query['password'],
    //         isDebug: request.query['isDebug']
    //     });
    //     cookies = await loginPage.cookies();
    //     fs.writeFileSync('cookies.json', JSON.stringify(cookies));
    // }
    response.send('Поехали...');

    while (new Date().getDate() < 2) {

        const result = await service.getProjects({
            cookies,
            words: keywords,
            isDebug: request.query['isDebug'],
            minBudget: request.query['minBudget'],
            maxBudget: request.query['maxBudget'],
            withoutContractor: true
        });

        if (result.error) {
            response.send(result.error);
            continue;
        }

        const pagesCount = 10;

        const filteredItems = result.items.filter(i => !i.alreadyApplied);
        // response.send({...result, items: filteredItems, length: filteredItems.length});

        for (let i = 0; i < filteredItems.length; i += pagesCount) {
            const splitProjects = filteredItems.slice(i, i + pagesCount);
            await Promise.all(splitProjects.map(async project => await service.sendProposalToProject(project.id, {
                cookies: cookies,
                costFrom: 1277, // request.body.costFrom,
                timeFrom: 1, // request.body.timeFrom,
                proposalDescription: '',// request.body.proposalDescription,
                isDebug: request.query['isDebug'] // request.query['isDebug']
            })));
        }
    }
    // response.send("<h2>Привет Express!</h2>");
});

// Отправить отклик на проект
app.post("/projects/:id/apply", async (request, response) => {

    // отправляем ответ
    if (!service) {
        service = new FlService();
    }

    let loginPage: Page;
    loginPage = await service.login({
        login: request.body.login,
        password: request.body.password,
        isDebug: request.body.isDebug
    });

    // await service.loginUpwork({
    //     login: request.body.login,
    //     password: request.body.password,
    //     isDebug: request.body.isDebug
    // });

    await service.sendProposalToProject(request.params.id, {
        cookies: await loginPage.cookies(),
        costFrom: request.body.costFrom,
        timeFrom: request.body.timeFrom,
        proposalDescription: request.body.proposalDescription,
        isDebug: request.body.isDebug
    });

    // response.send(result);
    // response.send("<h2>Привет Express!</h2>");
});
// начинаем прослушивать подключения на 3000 порту
app.listen(3000);
