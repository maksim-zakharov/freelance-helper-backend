import { BitcloutService } from "./bitclout.service";
import * as fs from "fs";
import { Cookie } from "puppeteer";
const dateFormat = require("dateformat");

jest.setTimeout(30000000);

test('Check bitclout', async () => {
  const service = new BitcloutService();
  const fileData = fs.readFileSync('cookies.json');
  const cookies = JSON.parse(fileData.toString()) as Cookie[];
  const page = await service.login({
    isDebug: true,
    login: 'max89701@gmail.com',
    password: '55543298max',
    rememberMe: true,
    cookies
  });
  const projects = await service.getAllCategoriesPurchases({cookies});

  // expect(projects).toBeTruthy();
  // expect(projects.items).toBeTruthy();
  // expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
});

test('Получить отчет за полгода по категориям', async () => {
  const service = new BitcloutService();
  const fromDate = dateFormat(new Date().setMonth(new Date().getMonth()-6), 'mm-dd-yyyy');
  const toDate = dateFormat(new Date(), 'mm-dd-yyyy');

  const fileData = fs.readFileSync('cookies.json');
  const cookies = JSON.parse(fileData.toString()) as Cookie[];
  const purchases = await service.getAllCategoriesPurchases({
    cookies,
    isDebug: true,
    fromDate,
    toDate
  });

  const medicine = purchases.filter(p => ['Медицина', "Аптеки"].includes(p.name)).reduce((acc, curr) => curr.amount + acc, 0) / 6;
  const food = purchases.filter(p => ["Супермаркеты"].includes(p.name)).reduce((acc, curr) => curr.amount + acc, 0) / 6;
  const fastFood = purchases.filter(p => ["Фастфуд","Рестораны"].includes(p.name)).reduce((acc, curr) => curr.amount + acc, 0) / 6;
  const constantPurchases = purchases.filter(p => ["Услуги банка", "Музыка", "Животные", "Связь", "Транспорт"].includes(p.name)).reduce((acc, curr) => curr.amount + acc, 0) / 6;
  const ficklePurchases = purchases.filter(p => ["Сервис", "Различные товары", "Развлечения", "Одежда и обувь", "Цветы", "Красота", "Образование", "Отели", "Ювелирные изделия и часы", "Спорттовары", "Ж/д билеты", "Госуслуги", "Фото/видео", "Кино", "Частные услуги"].includes(p.name)).reduce((acc, curr) => curr.amount + acc, 0) / 6;

  console.log('Трачу на лечение каждый месяц в среднем за 6 месяцев: {1}', medicine);
  console.log('Трачу на еду каждый месяц в среднем за 6 месяцев: {1}', food);
  console.log('Трачу на фастфуд каждый месяц в среднем за 6 месяцев: {1}', fastFood);
  console.log('Трачу на обязательные траты каждый месяц в среднем за 6 месяцев: {1}', constantPurchases);
  console.log('Сколько мог бы сэкономить каждый месяц в среднем за 6 месяцев: {1}', ficklePurchases);

  expect(purchases).toBeTruthy();
});
