import * as fs from "fs";
import { Cookie } from "puppeteer";
import { UpworkService } from "../upwork/upwork.service";

jest.setTimeout(300000000);

test('Авторизация в Lowadi', async () => {
  const isDebug = false;
  const service = new UpworkService();
  // if (!fs.existsSync('cookies.json')) {
  //   const page = await service.login({
  //     login: 'Шетландский пони',
  //     password: 'qwerty15',
  //     isDebug,
  //     rememberMe: true
  //   });
  // }

  // const fileData = fs.readFileSync('cookies.json');
  // const cookies = JSON.parse(fileData.toString()) as Cookie[];
  //
  // await service.feed({cookies, isDebug});

  const summary = await service.getSummaryByCipherText(`~014f3ab70ba4e1f3e7`);
  console.log(summary);

  // expect(projects).toBeTruthy();
  // expect(projects.items).toBeTruthy();
  // expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
});
