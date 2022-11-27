module.exports = {
    againOptions: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Играть ещё раз', callback_data: '/again'}],
            ]
        })
    }
}
