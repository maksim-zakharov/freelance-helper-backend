const axios = require('axios').default;
const cheerio = require('cheerio');

function convertTimeString(timeString) {
    if (timeString && timeString.includes('назад')) {
        return '';
    }
    return timeString;
}

module.exports.handler = async (event) => {
    const {data} = await axios.get('https://www.fl.ru/projects/');
    const $ = cheerio.load(data);

    const TITLE_SELECTOR = (id) => `#prj_name_${id}`;
    const CREATE_DATE_SELECTOR = (id) => `#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2)`;
    const VIEWS_SELECTOR = (id) => `#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > span.b-post__txt.b-post__txt_float_right.b-post__txt_fontsize_11.b-post__txt_bold.b-post__link_margtop_7`;
    const ALREADY_APPLIED_SELECTOR = (id) => `#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > a:nth-child(3)`;
    const PROPOSAL_COUNT_SELECTOR = (id) => `#project-item${id} > div.b-post__foot.b-post__foot_padtop_15 > div:nth-child(2) > a`;
    const DESCRIPTION_SELECTOR = (id) => `#project-item${id} > div.b-post__body.b-post__body_padtop_15.b-post__body_overflow_hidden.b-layuot_width_full > div.b-post__txt`;
    const PRICE_SELECTOR = (id) => `#project-item${id} > div.b-post__price.b-layout__txt_right.b-post__price_padleft_10.b-post__price_padbot_5.b-post__price_float_right.b-post__price_fontsize_15.b-post__price_bold`;

    const ids = $('#projects-list [id^="project-item"]').get().map((e) =>
        +$(e).attr('id').replace('project-item', ''));

    const result = ids
        .map(id => ({
            id: id,
            title: $(TITLE_SELECTOR(id)).text(),
            createDate: convertTimeString($(CREATE_DATE_SELECTOR(id)).text()
                .trim()
                .split('Проект   ')[1]),
            views: +$(VIEWS_SELECTOR(id))
                .text()
                .trim()
            ,
            alreadyApplied: $(ALREADY_APPLIED_SELECTOR(id))
                .text()
                .trim().includes('ответ'),
            proposalCount: +$(PROPOSAL_COUNT_SELECTOR(id))
                .text()
                .replace(/[^\x20-\x7E]/g, '')
                .trim(),
            link: `https://www.fl.ru${$(`#prj_name_${id}`).attr('href')}`,
            description: $(DESCRIPTION_SELECTOR(id))
                .text()
                .trimLeft()
                .trimRight(),
            price: +$(PRICE_SELECTOR(id))
                .text()
                .replace(/[^\x20-\x7E]/g, '')
                .trim(),
        }));

    return {
        "statusCode": 200,
        "headers": {"content-type": "application/json"},
        "body": JSON.stringify(result)
    };
};
