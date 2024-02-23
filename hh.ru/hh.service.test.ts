import { HhService } from "./hh.service";

jest.setTimeout(300000000);

test('', async () => {
  const service = new HhService();

  const projects = await service.getVacancies({
    words: ['angular']
    // , isDebug: true
  });

  expect(projects).toBeTruthy();
  expect(projects.items).toBeTruthy();
  expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
});

test('Просмотр топовых резюме', async () => {
  const service = new HhService();

  const projects = await service.getResumes({
    words: ['product manager менеджер по продукту NOT NAME:Python NOT NAME:analyst NOT NAME:помощник NOT NAME:marketing']
    , isDebug: true
  });

  expect(projects).toBeTruthy();
  expect(projects.items).toBeTruthy();
  expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
});
