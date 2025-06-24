addEventListener('fetch', event => {
    event.respondWith(handleUpdateRequest(event.request));
});
const TOKEN = globalThis.ENV_BOT_TOKEN;
const LOTTERY_KV = LOTTERY;
async function createLotteryInfo(chatId, name, joinText, maxUser, winUser,createUser) {
    const lotteryInfo = {
        name: name,
        joinText:joinText,
        maxUser: maxUser,
        winUser: winUser,
        createUser:createUser,
        users: [],
    };
    await LOTTERY_KV.put(`${chatId}:${joinText}`, JSON.stringify(lotteryInfo));
}

async function getLottery(chatId, joinText) {
    const lotteryData = await LOTTERY_KV.get(`${chatId}:${joinText}`);
    return lotteryData ? JSON.parse(lotteryData) : null;
}
async function sendMessage(chat_id,text) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chat_id,
            text: text,
            parse_mode: 'Markdown'
        }),
    });
}
async function sendMessageWithHTML(chat_id,text) {
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chat_id,
            text: text,
            parse_mode: 'HTML'
        }),
    });
}
async function drawLottery(chat_id, lottery) {
    const winners = [];
    const { users, winUser } = lottery;
    while (winners.length < winUser && winners.length < users.length) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const winner = users[randomIndex];

        if (!winners.includes(winner)) {
            winners.push(winner);
        }
    }
    const winnerUsers = winners.map(userId => `<a href="tg://user?id=${userId}">@${userId}</a>`).join('\n');
    await sendMessageWithHTML(chat_id, `🎉 WinUser:\n\n${winnerUsers}\n\nName：${lottery.name}`);
    const key = `${chat_id}:${lottery.joinText}`;
    await LOTTERY_KV.delete(key);
}
async function forceDrawLottery(chat_id, lottery) {
    const winners = [];
    const {users, winUser} = lottery;
    if (users.length === 0) {
        await sendMessage(chat_id,"No Joined User")
        return
    }
    const numberOfWinners = Math.min(users.length, winUser);
    while (winners.length < numberOfWinners) {
        const randomIndex = Math.floor(Math.random() * users.length);
        const winner = users[randomIndex];
        if (!winners.includes(winner)) {
            winners.push(winner);
        }
    }
    const winnerUsers = winners.map(userId => `<a href="tg://user?id=${userId}">@${userId}</a>`).join('\n');
    await sendMessageWithHTML(chat_id, `🎉 WinUser:\n\n${winnerUsers}\n\nName：${lottery.name}`);
    const key = `${chat_id}:${lottery.joinText}`;
    await LOTTERY_KV.delete(key);

}
function isGroupMessage(update) {
    if (!update.message) {
        return false;
    }
    return update.message.chat.type === 'group' || update.message.chat.type === 'supergroup';
}

function isCommand(messageText) {
    const parts = messageText.split(' ');
    if (parts.length === 0) {
        return false;
    }
    let command;
    if (parts[0].includes('@')) {
        command = parts[0].split('@')[0];
    } else {
        command = parts[0];
    }
    return command.startsWith('/');
}
async function handleUpdateRequest(request) {
    if (request.method !== 'POST') {
        return new Response('Invalid request', { status: 400 });
    }
    try {
        const update = await request.json();
        await handleUpdate(update)
        return new Response('OK', { status: 200 });
    } catch (error) {
        return new Response('Error processing request', { status: 500 });
    }
}
async function handleUpdate(update) {
    if (!update.message) {
        return
    }
    if (!update.message.text) {
        return
    }
    if (!update.message.from) {
        return
    }
    if (update.message.from.is_bot) {
        return
    }
    if (isCommand(update.message.text)){
        await handleCommandUpdate(update)
        return
    }
    if (isGroupMessage(update)) {
        await handleBotGroupTextUpdate(update)
    }

}
async function handleCommandUpdate(update){
    const chat_id = update.message.chat.id;
    const messageText = update.message.text;
    const parts = messageText.split(' ');
    let command;
    if (parts[0].includes('@')) {
        command = parts[0].split('@')[0];
    } else {
        command = parts[0];
    }
    switch (command) {
        case "/start":
            await sendMessage(chat_id, "Welcome To Lottery Bot\n\nThis bot runs entirely on Cloudflare Workers\nDeveloped by **Airp**");
            return
        case "/help":
            await sendMessage(chat_id, "Command:\n/create - Create New Lottery\n/force - Force a lottery draw\n/status - Get Lottery Status\n/close - Close Lottery");
            return
        case "/create":
            await handleBotCreateCommandUpdate(update)
            return
        case "/status":
            await handleBotStatusCommandUpdate(update)
            return
        case "/force":
            await handleBotForceCommandUpdate(update)
            return
        case "/close":
            await handleBotCloseCommandUpdate(update)
            return
    }
}
async function handleBotGroupTextUpdate(update) {
    const chat_id = update.message.chat.id;
    const messageText = update.message.text;
    const user_id = update.message.from.id;
    const lottery = await getLottery(chat_id, messageText);
    if (!lottery) {
        return;
    }
    if (lottery.users.includes(user_id)) {
        await sendMessage(chat_id, "Error: You Are Joined The Lottery");
        return
    }
    if (lottery.users.length >= lottery.maxUser) {
        await drawLottery(chat_id,lottery)
        return
    }
    lottery.users.push(user_id);
    await LOTTERY_KV.put(`${chat_id}:${messageText}`, JSON.stringify(lottery));
    await sendMessage(chat_id, `✅ You Have Joined the lottery: ${lottery.name}`);
    if (lottery.users.length >= lottery.maxUser) {
        await drawLottery(chat_id,lottery)
    }
}
async function handleBotForceCommandUpdate(update) {
    const chat_id = update.message.chat.id;
    const messageText = update.message.text;
    const parts = messageText.split(' ');
    if (!isGroupMessage(update)) {
        await sendMessage(chat_id, "Error: This is A Group Command");
        return;
    }
    if (parts.length !== 2) {
        await sendMessage(chat_id, "Error Command");
        return;
    }
    const lottery = await getLottery(chat_id, parts[1]);
    if (!lottery) {
        await sendMessage(chat_id, "Sorry The Lottery is don't exits!");
        return;
    }
    if (lottery.createUser !== update.message.from.id) {
        await sendMessage(chat_id, "Sorry You Don't The Lottery CreateUser");
        return;
    }
    await forceDrawLottery(chat_id, messageText);
}
async function handleBotCloseCommandUpdate(update) {
    const chat_id = update.message.chat.id;
    const messageText = update.message.text;
    const parts = messageText.split(' ');
    if (!isGroupMessage(update)) {
        await sendMessage(chat_id, "Error: This is A Group Command");
        return;
    }
    if (parts.length !== 2) {
        await sendMessage(chat_id, "Error Command");
        return;
    }
    const existingLottery = await getLottery(chat_id, parts[1]);
    if (!existingLottery) {
        await sendMessage(chat_id, "Sorry The Lottery is don't exits!");
        return;
    }
    const lottery = await getLottery(chat_id, parts[1]);
    if (!lottery) {
        await sendMessage(chat_id, "Sorry The Lottery is don't exits!");
        return;
    }
    if (lottery.createUser !== update.message.from.id) {
        await sendMessage(chat_id, "Sorry You Don't The Lottery CreateUser");
        return;
    }
    const key = `${chat_id}:${parts[1]}`;
    await LOTTERY_KV.delete(key);
    await sendMessage(chat_id, "Lottery Closed");
}
async function handleBotStatusCommandUpdate(update) {
    const chat_id = update.message.chat.id;
    const messageText = update.message.text;
    const parts = messageText.split(' ');
    if (!isGroupMessage(update)) {
        await sendMessage(chat_id, "Error: This is A Group Command");
        return;
    }
    if (parts.length !== 2) {
        await sendMessage(chat_id, "Error Command");
        return;
    }
    const existingLottery = await getLottery(chat_id, parts[1]);
    if (!existingLottery) {
        await sendMessage(chat_id, "Sorry The Lottery is don't exits!");
        return;
    }
    const { name, maxUser, winUser, users } = existingLottery;
    const statusMessage = `
        🎲 Lottery Status:
        - Name: **${name}**
        - Join Text: **${messageText}**
        - Max Users: ${maxUser}
        - Winners: ${winUser}
        - Created At: ${existingLottery.createUser}
        - Current User Count: ${users.length}
    `;
    await sendMessage(chat_id, statusMessage);
}
async function handleBotCreateCommandUpdate(update) {
    const chat_id = update.message.chat.id;
    const messageText = update.message.text;
    const parts = messageText.split(' ');
    if (!isGroupMessage(update)) {
        await sendMessage(chat_id, "Error: This is A Group Command");
        return;
    }
    if (parts.length !== 5) {
        await sendMessage(chat_id, "Error Command");
        return;
    }
    const name = parts[1];           // 抽奖名称
    const joinText = parts[2];       // 参与文本
    const maxUser = parseInt(parts[3]); // 最大用户数
    const winUser = parseInt(parts[4]); // 获奖用户数
    if (isNaN(maxUser) || maxUser <= 0) {
        await sendMessage(chat_id, "Error: max_user must be a positive number");
        return;
    }
    if (isNaN(winUser) || winUser <= 0) {
        await sendMessage(chat_id, "Error: win_user must be a positive number");
        return;
    }
    if (winUser > maxUser) {
        await sendMessage(chat_id, "Error: win_user cannot be greater than max_user");
        return;
    }

    const existingLottery = await getLottery(chat_id, joinText);
    if (existingLottery) {
        await sendMessage(chat_id, "Sorry The JoinText is exits!");
        return;
    }
    await createLotteryInfo(chat_id,name, joinText, maxUser, winUser,update.message.from.id);
    await sendMessage(chat_id, `🎲 Lottery Created!\n\nName: ${name}\nMax Users: ${maxUser}\nWinners: ${winUser}\nJoin Text: **${joinText}**`);
}
