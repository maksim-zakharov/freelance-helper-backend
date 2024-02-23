import { forkJoin, from, interval } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Browser, Page } from 'puppeteer'
import { createBrowser, createPage } from './puppeteer-extension';

export class BrowserManager {

  private resources: { browser: Browser, page: Page }[] = [];
  private busyResources: { browser: Browser, page: Page }[] = [];
  private _isDebug: boolean = false;

  constructor(isDebug: boolean = false) {
    this._isDebug = isDebug;
  }

  async init(browsersCount = 1, pagesCount = 1): Promise<void> {
    // TODO Использовать https://hackernoon.com/tips-and-tricks-for-web-scraping-with-puppeteer-ed391a63d952
    const browsers$ = from(this.createBrowsers(browsersCount));
    const pages$ = (browser) => from(this.createPages(pagesCount, browser)).pipe(
      map((pages: Page[]) => pages.map(page => ({page, browser})))
    );

    browsers$.pipe(
      switchMap(browsers => forkJoin(browsers.map(browser => pages$(browser)))),
      tap(resources => {
        this.resources = resources.reduce((curr, acc) => acc.concat(curr), []);
      })
    ).subscribe();
  }

  getPage(): Promise<Page> {
    return this.getResource$.pipe(map(resource => resource.page)).toPromise();
  }

  getFreeResource(): Promise<any> {
    return this.getResource$.toPromise();
  }

  clearPage(page: Page): void {
    const resource = this.busyResources.find(i => i.page === page);
    this.clearResource(resource);
  }

  clearResource(resource: any): void {
    this.busyResources = this.busyResources.filter(r => r !== resource);
    this.resources.push(resource);
  }

  private getResource$ = interval(100).pipe(
    filter(() => !!this.resources?.length),
    take(1),
    map(() => {
      const res = this.resources.shift();
      this.busyResources.push(res);
      return res;
    }),
    // shareReplay()
  );

  private async createBrowsers(count: number = 1): Promise<Browser[]> {
    const browsers = [];
    for (let j = 0; j < count; j++) {
      browsers.push(await createBrowser(this._isDebug));
    }
    return browsers;
  }

  private async createPages(count: number = 1, browser: Browser): Promise<Page[]> {
    const pages = [];
    for (let j = 0; j < count; j++) {
      pages.push(await createPage(browser, !this._isDebug));
    }
    return pages;
  }
}
