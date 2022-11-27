module.exports.start = (pool, bot, chatId) => {
    pool.getConnection((err, connection) => {
        if(err) throw err
        console.log('connected as id ' + connection.threadId)
        connection.query('SELECT * from departments', (err, rows) => {
            connection.release() // return the connection to pool

            // if(err) throw err
            console.log('The data from beer table are: \n', rows)
        })
    });
    return bot.sendMessage(chatId, 'Добро пожаловать в Гринатом!');
}
