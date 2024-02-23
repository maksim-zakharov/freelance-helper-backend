function getOffset(el) {
    const rect = document.querySelector(el).getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
    };
}

function like() {
document.querySelector('.ReactionButton--reaction-like')
//     document.querySelector('.CardBioReactions.CardBioReactions--vkcom > div.CardBioReactions__button.ReactionButton.ReactionButton--mode-primary.ReactionButton--reaction-like.ReactionButton--size-56.vkuiTappable.vkuiInternalTappable.vkuiTappable--sizeX-none.vkuiTappable--hover-has.vkuiTappable--hasActive')
    ?.click();

    // document.elementFromPoint(278.125, 579)?.click();
}

function dislike() {
    document.querySelector('.ReactionButton--reaction-dislike')
    // document.querySelector('.CardBioReactions.CardBioReactions--vkcom > div.CardBioReactions__button.ReactionButton.ReactionButton--mode-primary.ReactionButton--reaction-dislike.ReactionButton--size-56.vkuiTappable.vkuiInternalTappable.vkuiTappable--sizeX-none.vkuiTappable--hover-has.vkuiTappable--hasActive')
        ?.click();
    // document.elementFromPoint(75.375, 579)?.click();

}

function autolike() {
    setInterval(() => {
        // var totalInterests = document.querySelectorAll('.TagBase--mode-selected');
        // var online = document.querySelector('.OnlineCaption');
        // var description = document.querySelector('.CardFullInfo__about');
        // var verify = document.querySelector('.UserNameBase__aside');
        //
        // let message = '';
        // message += `Интересы: ${totalInterests.length > 2 ? 'Есть' : 'Нет'}`
        // message += ` Верификация: ${online ? 'Да' : 'Нет'}`
        // message += ` Описание: ${description ? 'Есть' : 'Нет'}`
        // message += ` Верификация: ${verify ? 'Да' : 'Нет'}`
        // console.log(message)
        //
        // if (totalInterests.length < 2) {
        //     dislike();
        // }
        //
        // if (verify || description || online) {
        //     like();
        // } else {
        //     dislike();
        // }

        like();
    }, 500)
}

// console.log(getOffset('.ReactionButton--reaction-like'))
// console.log(getOffset('.ReactionButton--reaction-dislike'))

autolike();
