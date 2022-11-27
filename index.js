const TelegramApi = require('node-telegram-bot-api')
const mysql = require('mysql')
const util = require('util');
const {unauthorizedOptions, authorizedOptions, profileOptions, interestsOption, acquaintanceOptions, registerOptions, dealsOptions} = require('./src/options');

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
        chat_id: '',
        interests: {},
    };
    let approachedUsers;
    let approachedUser;
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
        const msgText = msg.text;
        const chatId = msg.chat.id;
        const userTG = msg.from;
        const userId = userTG.id;
        message_id = msg.message_id;

        const row = await query(`SELECT * FROM users WHERE telegram_id = ${userId}`);

        const userFromDb = row[0];
        if (userFromDb !== undefined) {
            user.id = userFromDb.id;

            user.name = userFromDb.name;
            user.age = userFromDb.age;
            user.telegram_id = userId;
            user.telegram_username = userTG.username;
            user.position_id = userFromDb.position_id;
            user.description = userFromDb.description;
            user.city_id = userFromDb.city_id;
            const city = await query(`SELECT * FROM cities WHERE id = ${user.city_id}`);
            user.city_name = city[0].title;

            const departmentRow = await query(`SELECT d.id, d.title as department_title, p.title as position_title FROM departments d JOIN positions p ON p.department_id = d.id WHERE p.id = ${user.position_id}`);
            user.interests = await query(`SELECT * FROM interests WHERE user_id = ${user.id}`);
            user.department_id = departmentRow[0].id;
            user.department_title = departmentRow[0].department_title;
            user.position_title = departmentRow[0].position_title;
        }

        if (msgText === '/start') {
            let text = '';
            let options;
            if (row.length > 0) {
                text = `${user.name}, привет! 👋 \n\n` +
                       `Гринатом снова приветствует тебя!`
                options = authorizedOptions;
            } else {
                text = `Вы здесь впервые! Добро пожаловать в Гринатом! \n \n` +
                       `Этот бот создан для упрощения вашей работы в новом коллективе`;
                options = unauthorizedOptions;
            }


            return await bot.sendMessage(chatId, text, options);
        }
    });

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        const userTG = msg.from;
        const userId = userTG.id;

        const row = await query(`SELECT * FROM users WHERE telegram_id = ${userId}`);

        const userFromDb = row[0];
        if (userFromDb !== undefined) {
            user.id = userFromDb.id;

            user.name = userFromDb.name;
            user.age = userFromDb.age;
            user.telegram_id = userId;
            user.telegram_username = userTG.username;
            user.position_id = userFromDb.position_id;
            user.description = userFromDb.description;
            user.city_id = userFromDb.city_id;
            const city = await query(`SELECT * FROM cities WHERE id = ${user.city_id}`);
            user.city_name = city[0].title;

            const departmentRow = await query(`SELECT d.id, d.title as department_title, p.title as position_title FROM departments d JOIN positions p ON p.department_id = d.id WHERE p.id = ${user.position_id}`);
            user.interests = await query(`SELECT * FROM interests WHERE user_id = ${user.id}`);
            user.department_id = departmentRow[0].id;
            user.department_title = departmentRow[0].department_title;
            user.position_title = departmentRow[0].position_title;
        }

        if (data === '/landing') {
            const text = `${user.name}, привет! 👋`
            return await bot.sendMessage(chatId, text, authorizedOptions);
        }

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
                                console.log(user.position_id);

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

                                await bot.sendMessage(chatId, 'Вы успешно зарегистрировались!', registerOptions)
                            });
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
            let text = '👤 *Имя*: ' + user.name + '\n' +
                       '🔞 *Возраст*: ' + user.age + '\n \n' +
                       '🌆 *Город*: ' + user.city_name + '\n' +
                       '🏢 *Отдел*: ' + user.department_title + '\n' +
                       '👷 *Должность*: ' + user.position_title + '\n \n' +
                       '📖 *О себе*: _' + user.description + '_'
            await bot.sendMessage(chatId, text, profileOptions);
        }

        if (data === '/interests') {
            const interests = await query(`SELECT * FROM interests WHERE user_id = ${user.id}`);

            let text = '🎙️ Музыка: ' + interests.find(e => e.title === 'music').favorite + '\n \n' +
                   '🎬 Фильмы: ' + interests.find(e => e.title === 'films').favorite + '\n \n' +
                   '📚 Книги: ' + interests.find(e => e.title === 'books').favorite + '\n \n' +
                   '🎮 Видеоигры: ' + interests.find(e => e.title === 'video_games').favorite
            ;

            bot.sendMessage(chatId, text, interestsOption);
        }

        if (data === '/acquaintances') {
            const users = await query(`SELECT * FROM users WHERE id != ${user.id}`);
            for (const u of users) {
               const rate = await query(`SELECT Avg(rate) AS rating FROM rates WHERE user_id = ${u.id}`);
               const interests = await query(`SELECT title, favorite FROM interests WHERE user_id = ${u.id}`);
               u.approached = 0;
               u.common = {
                   title: '',
                   length: 0,
                   city: false,
               };
               u.interests = interests;
               u.rate = rate[0].rating;

               if (u.rate < 3) {
                   u.approached -= 1;
               }
               if (u.rate > 3) {
                   u.approached += 1;
               }
               if (u.city_id === user.city_id) {
                   u.common.city = true;
                   u.approached += 2;
               }

               for (const i of u.interests) {
                   for (const mainI of user.interests) {
                       if (i.title === mainI.title) {
                           let mainInterests = mainI.favorite.split(',').map(i => i.trim());
                           let foreignInterests = i.favorite.split(',').map(i => i.trim());
                           var common = mainInterests.filter(x => foreignInterests.indexOf(x) !== -1);
                           if (common.length > 0) {
                               u.approached += common.length;
                               if (common.length > u.common.length) {
                                   u.common.title = i.title;
                                   u.common.approached = common.length
                               }
                           }
                       }
                   }
               }
            }
            approachedUser = users.sort((a,b) => (a.approached > b.approached) ? -1 : ((b.approached > a.approached) ? 1 : 0))
                .shift();

            approachedUsers = users;

            let text = '🎉 *Мы нашли его!* 🎉 \n \n' +
                       '👤 *Имя*: ' + approachedUser.name + '\n' +
                       '🔞 *Возраст*: ' + approachedUser.age + '\n \n' +
                       '💌 *Телега*: @' + approachedUser.telegram_username + '\n \n' +
                       '📊 _Подходит вам на ' + approachedUser.approached * 10 + ' %_ \n' +
                       '🎯 _Больше всего вы сошлись на ' + approachedUser.common.title.charAt(0).toUpperCase() + approachedUser.common.title.slice(1) + '_'
            ;

            if (approachedUser.common.city) text += '\n\n 🌆 *Живёт с вами в одном городе*';

            bot.sendMessage(chatId, text, acquaintanceOptions);
        }

        if (data === '/nextAcquaintances') {
            if (approachedUsers.length === 0) {
                return bot.sendMessage(chatId, 'Вы просмотрели всех пользователей!', profileOptions)
            }
            approachedUser = approachedUsers.sort((a,b) => (a.approached > b.approached) ? -1 : ((b.approached > a.approached) ? 1 : 0))
            .shift();

            let text = '🎉 *Мы нашли его!* 🎉 \n \n' +
                '👤 *Имя*: ' + approachedUser.name + '\n' +
                '🔞 *Возраст*: ' + approachedUser.age + '\n \n' +
                '💌 *Телега*: @' + approachedUser.telegram_username + '\n \n' +
                '📊 _Подходит вам на ' + approachedUser.approached * 10 + ' %_ \n' +
                '🎯 _Больше всего вы сошлись на ' + approachedUser.common.title.charAt(0).toUpperCase() + approachedUser.common.title.slice(1).replace('_', ' ')+ '_'
            ;

            if (approachedUser.common.city) text += '\n\n 🌆 *Живёт с вами в одном городе*';

            bot.sendMessage(chatId, text, acquaintanceOptions);
        }

        if (data === '/deal') {
            let text = '🗓️ Когда вам удобно встретиться? \n \n (Введите количество дней в течение которых может состяться встреча)';
            const datePrompt = await bot.sendMessage(chatId, text, {
                reply_markup: {
                    force_reply: true,
                }
            });

            bot.onReplyToMessage(chatId, datePrompt.message_id, async (dateMsg) => {
                const date = dateMsg.text;

                const inviteOptions = {
                    reply_markup: JSON.stringify({
                        inline_keyboard: [
                            [{text: 'Согласиться на встречу в онлайн формате', callback_data: '/dealConfirm'+approachedUser.telegram_id+'_'+chatId+'_'+date+'_'+1}],
                            [{text: 'Согласиться на встречу в оффлайн формате', callback_data: '/dealConfirm'+approachedUser.telegram_id+'_'+chatId+'_'+date+'_'+1}],
                            [{text: 'Назначить другое время', callback_data: '/dealConfirm'}, {text: 'Отклонить', callback_data: '/nextAcquaintances'}],
                        ]
                    }),
                    parse_mode: 'markdown'
                };


                let text = 'Вам прислали приглашение на встречу! \n \n' +
                           `${user.name} предлагает вам встретиться в течении ${date} дней`;
                const msg = await bot.sendMessage(approachedUser.telegram_id, text, inviteOptions);

                let demandText = 'Приглашение отправлено! Ждём ответа от пользователя.';
                await bot.sendMessage(chatId, demandText);
            });
        }

        if (data.includes('/dealConfirm')) {
            const str = data.split('_');
            const demand_user_id = Number(str[0].match(/\d+/)[0]);
            const offer_user_id = Number(str[1]);
            const date = Number(str[2]);
            const offline = str[3] !== undefined;

            const demand_user_query = await query(`SELECT * FROM users WHERE telegram_id = ${demand_user_id}`);
            const offer_user_query = await query(`SELECT * FROM users WHERE telegram_id = ${offer_user_id}`);

            const demand_user = demand_user_query[0];
            const offer_user = offer_user_query[0];

            let demandText = `Вы согласовали встречу с пользователем ${offer_user.name} \n \n` +
                              `Она должна пройти в течение ${date} дней`;
            let offerText = `Вы согласовали встречу с пользователем ${demand_user.name} \n \n` +
                            `Она должна пройти в течение ${date} дней`;

            await query(`INSERT INTO deals(date, demand_user_id, offer_user_id) VALUES(${date}, ${demand_user_id}, ${offer_user_id})`);

            await bot.sendMessage(demand_user_id, demandText, authorizedOptions);
            await bot.sendMessage(offer_user_id, offerText, authorizedOptions);
        }

        if (data === '/deals') {
            let text = '👥 *Ваши встречи* \n'

            await bot.sendMessage(chatId, text, dealsOptions);
        }

        if (data === '/dealsActive') {
            let text = 'Активные встречи';
            const deals = await query(`SELECT * FROM deals WHERE demand_user_id = ${chatId} OR offer_user_id = ${chatId} AND active = 1`);

            const activeDealsOptions = {
                reply_markup: JSON.stringify({
                    inline_keyboard:
                    deals.map((d, i) => {
                        let userId;
                        if (d.offer_user_id !== chatId) userId = d.offer_user_id;
                        if (d.demand_user_id !== chatId) userId = d.demand_user_id;

                        return [{text: 'Встреча ' + d.id, callback_data: String('/dealActive'+d.id+'_'+userId)}];
                    }).filter(d => d !== undefined)
                }),
                parse_mode: 'markdown'
            }

            await bot.sendMessage(chatId, 'Активные встречи', activeDealsOptions);
        }

        if (data.includes('/dealActive')) {
            const str = data.split('_');
            const deal_id = Number(str[0].match(/\d+/)[0]);
            const user_id = Number(str[1]);

            const userQuery = await query(`SELECT * FROM users WHERE telegram_id = ${user_id}`)
            const user = userQuery[0];

            let text = `Встреча с пользователем ${user.name}`

            const activeDealOption = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{text: 'Назад', callback_data: '/landing'}, {text: 'Встреча состоялась', callback_data: '/dealComplete' + deal_id + '_' + user_id}],
                    ]
                }),
                parse_mode: 'markdown'
            }

            bot.sendMessage(chatId, text, activeDealOption);
        }

        if (data.includes('/dealComplete')) {
            const str = data.split('_');
            const deal_id = Number(str[0].match(/\d+/)[0]);
            const user_id = Number(str[1].match(/\d+/)[0]);

            await query(`UPDATE deals SET active = 0 WHERE id = ${deal_id}`);

            let text = 'Встреча успешно завершена! Оцените её от 0 до 5';

            const ratePrompt = await bot.sendMessage(chatId, text, {
                reply_markup: {
                    force_reply: true,
                }
            });

            bot.onReplyToMessage(chatId, ratePrompt.message_id, async (rateMsg) => {
                const rate = Number(rateMsg.text);

                await query(`INSERT INTO rates(rate, user_id) VALUES(${rate}, ${user_id})`);

                await bot.sendMessage(chatId, 'Вы оценили встречу с сотрудником', interestsOption);
            })
        }
    });
}

start()
