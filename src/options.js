module.exports = {
     unauthorizedOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Заполнить анкету', callback_data: '/signup'}],
            ]
        })
    },

    authorizedOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Моя анкета', callback_data: '/profile'}],
                [{text: 'Новые знакомста', callback_data: '/acquaintances'}],
            ]
        })
    },

    selectDepartments: {
         reply_markup: JSON.stringify({
             inlinte_keyboard: [

             ]
         })
    }

    // authorizationOptions: {
    //      reply_markup: JSON.stringify({
    //          inline_keyboard: [
    //              [{''}]
    //          ]
    //      })
    // }
}
