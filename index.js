const TelegramApi = require('node-telegram-bot-api')
const mysql = require('mysql')
const util = require('util');
const {unauthorizedOptions, authorizedOptions, authorizationOptions} = require('./src/options');

const connection = mysql.createConnection({
    connectionLimit : 10,
    host            : 'db4free.net',
    user            : 'hardcod_bot',
    password        : 'zWX4@YU4G!Ft6ZD',
    database        : 'hardcod_grinatom'
})
const query = util.promisify(connection.query).bind(connection);

const token = '5558457967:AAEAcGmjPHjVyVxODcc_oDCqzvcU6W40ihA';

const bot = new TelegramApi(token, {polling: {interval: 1000}})

const start = async () => {
    let user = {
        id: '',
        name: '',
        age: '',
        telegram_id: '',
        telegram_username: '',
        department_id: '',
        position_id: '',
        description: '',
        city_id: '',
        department_title: '',
        position_title: '',
        interests: {},
    };
    let message_id;
    const departments = await query(`SELECT * FROM departments`);
    const positions = await query(`SELECT * FROM positions`);
    const cities = await query(`SELECT * FROM cities`);
    const interests = [
        {
            enum: 'music',
            title: 'Музыка',
            favorite: '',
        },
        {
            enum: 'films',
            title: 'Фильмы',
            favorite: '',
        },
        {
            enum: 'television_show',
            title: 'Телевизионные шоу',
            favorite: '',
        },
        {
            enum: 'books',
            title: 'Книги',
            favorite: '',
        },
        {
            enum: 'video_games',
            title: 'Видео игры',
            favorite: '',
        },
        {
            enum: 'quotes',
            title: 'Цитаты',
            favorite: '',
        }
    ];

    bot.setMyCommands([
        {command: '/start', description: 'Начальное действие'}
    ]);

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        const userTG = msg.from;
        const userId = userTG.id;
        message_id = msg.message_id;

        if (text === '/start') {
            const row = await query(`SELECT * FROM users WHERE telegram_id = ${userId}`);
            let text = '';
            let options;
            if (row.length > 0) {

                const userFromDb = row[0];
                user.id = userFromDb.name;

                user.name = userFromDb.name;
                user.age = userFromDb.age;
                user.telegram_id = userId;
                user.telegram_username = userTG.username;
                user.position_id = userFromDb.position_id;
                user.decription = userFromDb.decription;
                user.city_id = userFromDb.city_id;

                const departmentRow = await query(`SELECT d.id, d.title as department_title, p.title as position_title FROM departments d JOIN positions p ON p.department_id = d.id WHERE p.id = ${user.position_id}`);
                user.department_id = departmentRow[0].id;
                user.department_title = departmentRow[0].department_title;
                user.position_title = departmentRow[0].position_title;

                text = `Привет, ${user.name}`
                options = authorizedOptions;
            } else {
                text = `Вы здесь впервые!`;
                options = unauthorizedOptions;
            }

            return await bot.sendMessage(chatId, text, options);
        }
    });

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/signup') {
            const selectDepartments = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        departments.map(d => {
                            return {text: d.title, callback_data: String('/dep' + d.id)};
                        })
                    ]
                })
            }

            const namePrompt = await bot.sendMessage(chatId, "Как тебя зовут?", {
                reply_markup: {
                    force_reply: true,
                },
            })

            bot.onReplyToMessage(chatId, namePrompt.message_id, async (nameMsg) => {
                user.name = nameMsg.text;

                const agePrompt = await bot.sendMessage(chatId, `Привет, ${user.name}. Сколько тебе лет?`, {
                    reply_markup: {
                        force_reply: true,
                    },
                });

                bot.onReplyToMessage(chatId, agePrompt.message_id, async (ageMsg) => {
                    user.age = ageMsg.text;

                    await bot.sendMessage(chatId, `Тебя зовут ${user.name}, тебе ${user.age} лет`);

                    await bot.sendMessage(chatId, 'В каком департаменте ты работаешь?', selectDepartments);
                });
            });
        }

        if (data.includes('dep')) {
            user.department_id = Number(data.match(/\d+/)[0]);
            const filteredPositions = positions.filter(p => p.department_id === user.department_id);
            const selectPositions = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        filteredPositions.map(p => {
                            return {text: p.title, callback_data: String('/pos' + p.id)};
                        })
                    ]
                })
            }

            await bot.sendMessage(chatId, 'На какой должности ты работаешь?', selectPositions);
        }

        if (data.includes('pos')) {
            user.position_id = Number(data.match(/\d+/)[0]);
            const selectCities = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        cities.map((c, i) => {
                            if (i < 3) {
                                return {text: c.title, callback_data: String('/cit' + c.id)};
                            }
                        }).filter(c => c !== undefined),
                        cities.map((c, i) => {
                            if (i > 4) {
                                return {text: c.title, callback_data: String('/cit' + c.id)};
                            }
                        }).filter(c => c !== undefined)
                    ]
                })
            }

            await bot.sendMessage(chatId, 'Из какого ты города?', selectCities);
        }

        if (data.includes('cit')) {
            user.city_id = Number(data.match(/\d+/)[0]);

            const musicPrompt = await bot.sendMessage(chatId, "Любимая музыка: \n \n (Перечислите через запятую)", {
                reply_markup: {
                    force_reply: true,
                },
            });

            bot.onReplyToMessage(chatId, musicPrompt.message_id, async (musicMsg) => {
                interests.find(i => i.enum === 'music').favorite = musicMsg.text;

                const filmsPrompt = await bot.sendMessage(chatId, "Любимые фильмы: \n \n (Перечислите через запятую)", {
                    reply_markup: {
                        force_reply: true,
                    }
                });

                bot.onReplyToMessage(chatId, filmsPrompt.message_id, async (filmsMsg) => {
                    interests.find(i => i.enum === 'films').favorite = filmsMsg.text;

                    const booksPrompt = await bot.sendMessage(chatId, "Любимые книги: \n \n (Перечислите через запятую)", {
                        reply_markup: {
                            force_reply: true,
                        }
                    });

                    bot.onReplyToMessage(chatId, booksPrompt.message_id, async (booksMsg) => {
                        interests.find(i => i.enum === 'books').favorite = booksMsg.text;

                        const videoGamesPrompt = await bot.sendMessage(chatId, "Любимые видеоигры: \n \n (Перечислите через запятую)", {
                            reply_markup: {
                                force_reply: true,
                            }
                        });

                        bot.onReplyToMessage(chatId, videoGamesPrompt.message_id, async (videoGamesMsg) => {
                            interests.find(i => i.enum === 'video_games').favorite = videoGamesMsg.text;

                            const descriptionPrompt = await bot.sendMessage(chatId, "Расскажите немного о себе: \n \n", {
                                reply_markup: {
                                    force_reply: true,
                                }
                            })

                            bot.onReplyToMessage(chatId, descriptionPrompt.message_id, async (descriptionMsg) => {
                                user.description = descriptionMsg.text;
                                const userId = descriptionMsg.from.id;
                                const username = descriptionMsg.from.username;

                                await query(`INSERT INTO users (name, age, telegram_id, telegram_username, involvement_count, description, position_id, city_id)
                                VALUES('${user.name}', '${user.age}', '${userId}', '${username}', 1, '${user.description}', '${user.position_id}', '${user.city_id}')
                            `);

                                const userDB = await query(`SELECT id FROM users WHERE telegram_id = ${userId}`);
                                const userIdDB = userDB.reduce(u => u.id).id

                                const interestsResult = await query(`
                                INSERT INTO interests (title, favorite, user_id)
                                VALUES
                                    ('music', '${interests.find(i => i.enum === "music").favorite}', ${userIdDB}),
                                    ('films', '${interests.find(i => i.enum === "films").favorite}', ${userIdDB}),
                                    ('books', '${interests.find(i => i.enum === "books").favorite}', ${userIdDB}),
                                    ('video_games', '${interests.find(i => i.enum === "video_games").favorite}', ${userIdDB})`);
                            })
                        });
                    });
                });
            });
            // const descriptionPrompt = await bot.sendMessage(chatId, "Расскажи о себе", {
            //     reply_markup: {
            //         force_reply: true,
            //     },
            // })
            //
            // bot.onReplyToMessage(chatId, descriptionPrompt.message_id, async (descriptionMsg) => {
            //     user.description = descriptionMsg.text;
            //     user.telegram_id = descriptionMsg.from.id;
            //     user.telegram_username = descriptionMsg.from.username;
            //
            //     const result = await query(`INSERT INTO users (name, age, telegram_id, telegram_username, involvement_count, description, position_id, city_id)
            //         VALUES('${user.name}', '${user.age}', '${user.telegram_id}', '${user.telegram_username}', 1, '${user.description}', '${user.position_id}', '${user.city_id}')
            //     `);
            //     console.log(result);
            // })
        }

        if (data === '/profile') {
            console.log(user)
            let text = 'Имя: ' + user.name + '\n' +
                       'Возраст: ' + user.age + '\n \n' +
                       'Отдел: ' + user.department_title + '\n' +
                       'Должность: ' + user.position_title + '\n \n' +
                       'О себе: ' + user.description
            await bot.sendMessage(chatId, text);
        }
    });
}

start()
