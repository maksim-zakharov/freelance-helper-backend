import { BadooService } from "./badoo.service";
import * as fs from "fs";
import { Cookie } from "puppeteer";
const dateFormat = require("dateformat");

jest.setTimeout(300000000);

test('Авторизация в Badoo', async () => {
  const service = new BadooService();
  if(!fs.existsSync('cookies.json')){
    const page = await service.login({isDebug: false});
  }

  const fileData = fs.readFileSync('cookies.json');
  const cookies = JSON.parse(fileData.toString()) as Cookie[];

  await service.autoLikes({cookies, isDebug: false});

  // expect(projects).toBeTruthy();
  // expect(projects.items).toBeTruthy();
  // expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
});
