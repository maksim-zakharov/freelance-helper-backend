import { LumalyService } from "./lumaly.service";
import * as fs from "fs";
import { Cookie } from "puppeteer";

jest.setTimeout(300000000);

test('addNewShopRule', async () => {
  const service = new LumalyService();

  const utlString = 'craft-sports.de,outdoor-renner.de,anndora.de,karneval-universe.de,emil-die-flasche.de';
  const urls = utlString.split(',');
  await service.login({isDebug: true});
  await Promise.all(urls.map(shopDomain => service.editShopRule({ shopDomain, isDebug: true})));
});
