import {FlService} from "./fl.service";
import * as fs from "fs";
import {Cookie} from "puppeteer";

jest.setTimeout(300000);

test('Получить список проектов без авторизации по Ангуляру', async () => {
    const service = new FlService();

    const projects = await service.getProjects({words: ['angular']
        // , isDebug: true
    });

    expect(projects).toBeTruthy();
    expect(projects.items).toBeTruthy();
    expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
});

test('Получить список проектов без авторизации с определенной фильтрацией', async () => {
    const service = new FlService();
    const minBudget = 1000;
    const maxBudget = 150000;

    const projects = await service.getProjects({
        words: ['angular', 'react'],
        minBudget: minBudget,
        maxBudget: maxBudget,
        withoutContractor: true,
        // isDebug: true
    });

    expect(projects).toBeDefined();
    expect(projects.items).toBeDefined();
    expect(projects.items.length).toBeGreaterThanOrEqual(projects.length);
    expect(projects.items.filter(i => i.price).some(i => i.price < minBudget || i.price > maxBudget)).toBeFalsy();
});

test('При получении списка проектов кинуть ошибку о том что не передали параметры', async () => {
    const service = new FlService();

    const {error} = await service.getProjects(undefined);

    expect(error).toBe('Нужно передать параметры для поиска');
});

test('При получении списка проектов кинуть ошибку о том что отсутствуют ключевики', async () => {
    const service = new FlService();

    const {error} = await service.getProjects({words: undefined});

    expect(error).toBe('Нужно передать ключевые слова для поиска');
});

test('При отклике на проект отдать ошибку о короткой длине описания', async () => {
    const service = new FlService();
    const projectId = 4319056;
    const fileData = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(fileData.toString()) as Cookie[];

    await expect(service.sendProposalToProject(projectId, {
        cookies: cookies,
        proposalDescription: 'Тест',
        costFrom: 1000,
        timeFrom: 1
    })).rejects.toEqual(new Error(`Длина описания должна быть не менее 5 символов`));
});

test('При отклике на проект отдать ошибку о обязательной оценке стоимости', async () => {
    const service = new FlService();
    const projectId = 4319056;
    const fileData = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(fileData.toString()) as Cookie[];

    await expect(service.sendProposalToProject(projectId, {
        cookies: cookies,
        proposalDescription: 'Тест1',
        costFrom: undefined,
        timeFrom: 1
    })).rejects.toEqual(new Error(`Необходимо указать минимальную стоимость`));
});

test('При отклике на проект отдать ошибку о обязательной оценке сроков', async () => {
    const service = new FlService();
    const projectId = 4319056;
    const fileData = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(fileData.toString()) as Cookie[];

    await expect(service.sendProposalToProject(projectId, {
        cookies: cookies,
        proposalDescription: 'Тест1',
        costFrom: 1,
        timeFrom: undefined
    })).rejects.toEqual(new Error(`Необходимо указать минимальные сроки`));
});

test('При отклике на проект отдать ошибку о том что исполнитель уже найден', async () => {
    const service = new FlService();
    const projectId = 4319056;
    const fileData = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(fileData.toString()) as Cookie[];

    await expect(service.sendProposalToProject(projectId, {
        cookies: cookies,
        proposalDescription: 'Тестовое описание',
        costFrom: 1000,
        timeFrom: 1
    })).rejects.toEqual(new Error(`На проект ${projectId} уже выбран исполнитель.`));
});

test('При отклике на проект отдать ошибку о том что уже откликались', async () => {
    const service = new FlService();
    const projectId = 4280634;
    const fileData = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(fileData.toString()) as Cookie[];

    await expect(service.sendProposalToProject(projectId, {
        cookies: cookies,
        proposalDescription: 'Тестовое описание',
        costFrom: 1000,
        timeFrom: 1
    })).rejects.toEqual(new Error(`На проект ${projectId} уже есть отклик.`));
});

test('При отклике на проект отдать ошибку о том что уже отказался от проекта', async () => {
    const service = new FlService();
    const projectId = 4318527;
    const fileData = fs.readFileSync('cookies.json');
    const cookies = JSON.parse(fileData.toString()) as Cookie[];

    await expect(service.sendProposalToProject(projectId, {
        cookies: cookies,
        proposalDescription: 'Тестовое описание',
        costFrom: 1000,
        timeFrom: 1
    })).rejects.toEqual(new Error(`Вы уже отказались от проекта ${projectId}.`));
});
