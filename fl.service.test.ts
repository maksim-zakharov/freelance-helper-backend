import {FlService} from "./fl.service";

jest.setTimeout(30000);

test('Получить список проектов без авторизации', async () => {
    const service = new FlService();

    const projects = await service.getProjects({words: ['angular'], isDebug: true});
    console.log(projects);
    // expect(tree).toMatchSnapshot();
});
