module.exports = {
     unauthorizedOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Заполнить анкету', callback_data: '/signup'}],
            ]
        })
    },

    registerOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Начать', callback_data: '/landing'}],
            ]
        })
    },

    authorizedOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Моя анкета', callback_data: '/profile'}],
            ]
        })
    },

    profileOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Найти нового знакомого среди сотрудников', callback_data: '/acquaintances'}],
                [{text: 'Мои интересы', callback_data: '/interests'}],
                [{text: 'Мои встречи с сотрудниками', callback_data: '/deals'}],
                [{text: 'Назад', callback_data: '/landing'}],
            ]
        }),
        parse_mode: 'markdown',
    },

        interestsOption: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Поиск нового знакомого среди сотрудников', callback_data: '/acquaintances'}],
                [{text: 'Назад', callback_data: '/landing'}],
            ]
        })
    },

    acquaintanceOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Договориться о встрече', callback_data: '/deal'}, {text: 'Следующий пользователь', callback_data: '/nextAcquaintances'}],
                [{text: 'Назад', callback_data: '/landing'}],
            ]
        }),
        parse_mode: 'markdown'
    },

    dealsOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Только активные', callback_data: '/dealsActive'}],
                [{text: 'Все', callback_data: '/dealsAll'}],
                [{text: 'Назад', callback_data: '/landing'}],
            ]
        }),
        parse_mode: 'markdown'
    },
}
