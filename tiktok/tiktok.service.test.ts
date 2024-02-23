import { TiktokService } from "./tiktok.service";
import * as fs from "fs";
import { Cookie } from "puppeteer";
import { Tiktok } from "./tiktok.models";
import ChallengeItem = Tiktok.ChallengeItem;

jest.setTimeout(300000);

test('Авторизация в Тинькофф', async () => {
  const service = new TiktokService();

  const fileData = fs.readFileSync('cookies.json');
  const cookies = JSON.parse(fileData.toString()) as Cookie[];
  // const projects = await service.getAllCategoriesPurchases({cookies});

  // expect(projects).toBeTruthy();
  // expect(projects.items).toBeTruthy();
  // expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
});

test('Получить список проектов без авторизации по Ангуляру', async () => {

  const service = new TiktokService();
  const items: ChallengeItem[] = [];

  for (let i = 0; i < 100; i++) {
    const {itemList} = await service.getChallengesByTag('программирование', i * 35, 35);
    if (!itemList) {
      break;
    }
    items.push(...itemList);
  }

  const allChallenges: any = selectMany<ChallengeItem>(items, item => item.challenges);

  const topChallenges = countBy(allChallenges, i => i.title).sort(function (a, b) {
    if (a[1] > b[1]) {
      return -1;
    }
    if (a[1] < b[1]) {
      return 1;
    }
    // a должно быть равным b
    return 0;
  }).splice(0, 15);

  expect(topChallenges).toBeTruthy();
});

let countBy = <T = any>(arr: T[], predicate?: (value: T) => unknown) => {
  return Object.entries(arr.reduce((acc, val) => {
    const value = predicate(val);
    acc[value.toString()] = (acc[value.toString()] || 0) + 1;
    return acc;
  }, {} as any));
};

let selectMany = <T>(items, predicate?: (value: T) => unknown): T => {
  return items.map(predicate).reduce((arr, curr) => arr.concat(curr), []);
};

let distinct = <T>(items, selector?: (x: T) => unknown): Array<T> => {
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
