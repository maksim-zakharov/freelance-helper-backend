// подключение express
import * as express from "express";
import {FLService} from "./test";
// создаем объект приложения
const app = express();

let service: FLService;
// определяем обработчик для маршрута "/"
app.get("/", async (request, response) => {

    // отправляем ответ
    if(!service){
        service = new FLService();
    }

    const result = await service.getProjects('angular', 'node.js', 'nodejs', 'react');

    response.send(result);
    // response.send("<h2>Привет Express!</h2>");
});
// начинаем прослушивать подключения на 3000 порту
app.listen(3000);
