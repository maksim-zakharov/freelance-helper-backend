import '../utils/puppeteer-extension';

import * as dotenv from 'dotenv';
import axios from 'axios';
import { Tiktok } from "./tiktok.models";
import CollectionResponse = Tiktok.CollectionResponse;
import ChallengeItem = Tiktok.ChallengeItem;
import { createBrowser, createPage, tryNavigate } from "../utils/puppeteer-extension";

const cheerio = require('cheerio');

export class TiktokService {

  private _dictionary = {};

  constructor() {
    dotenv.config()
  }

  async getChallengesByTag(tagName: string, offset = 0, count = 30)
    : Promise<any>
  // : Promise<CollectionResponse<ChallengeItem>>
  {
    if (count > 35) {
      throw new Error("Count doesn't be great than 35");
    }

    let tagId = Object.entries(this._dictionary).find(([key, value]) => key === tagName)?.slice(1);
    if (!tagId) {
      const _browser = await createBrowser();

      const page = await createPage(_browser);

      await tryNavigate(page, `https://www.tiktok.com/tag/${tagName}?lang=ru-RU`);

      const content = await page.content();
      let $ = cheerio.load(content);
      tagId = $('meta[property="al:ios:url"]').first().attr('content').split('?')[0].split('/')[4];
      this._dictionary[tagName] = tagId;
    }

    return await axios.get(`https://m.tiktok.com/api/challenge/item_list/?aid=1988&challengeID=${tagId}&count=${count}&cursor=${offset}`)
      .then(async (response) => {
        if (response.data.type) {
          response.data = await this.getByPuppeteer(`https://m.tiktok.com/api/challenge/item_list/?aid=1988&challengeID=70578828&count=${count}&cursor=${offset}`);
          console.log(JSON.stringify(response.headers))
          console.log(JSON.stringify(response.data))
          return response.data;
        } else {
          return response.data;
        }
      })
    // .then(console.log)
  }

  getByPuppeteer = async (url) => {

    const _browser = await createBrowser();

    const page = await createPage(_browser);

    await tryNavigate(page, url);

    const content = await page.content();
    let $ = cheerio.load(content);
    return $('body').text();
  }
}


