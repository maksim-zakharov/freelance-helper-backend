// подключение express
import * as express from "express";
import {FLService} from "./test";
// создаем объект приложения
const app = express();

let service: FLService;
// определяем обработчик для маршрута "/"
app.get("/", async (request, response) => {

    // отправляем ответ
    if (!service) {
        service = new FLService();
    }

    const keywords = request.query['keywords'] as string[];
    if (!keywords?.length) {
        response.send('ОШИБКА');
        return;
    }

    const result = await service.getProjects({
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
