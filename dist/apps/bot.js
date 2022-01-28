"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handlers_1 = require("../handlers");
const createApp = (handle, conf) => {
    const app = express_1.default();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    const { Bot } = conf.models || {};
    app.all('/oauth', async (req, res) => {
        console.log('doing oauth on bot...');
        const bot = (await Bot.init({
            code: req.query.code,
            token: req.body,
        }));
        console.log('start setting up webhook...');
        await bot.setupWebHook(); // this might take a while, depends on when the bot user is ready
        console.log('finish setting up webhook');
        await handle({ type: 'BotAdded', bot });
        console.log('BotAdded handle done');
        res.send('');
    });
    app.post('/webhook', async (req, res) => {
        const message = req.body;
        console.log('WebHook payload:', JSON.stringify(message));
        const body = message.body;
        if (body) {
            switch (body.eventType) {
                case 'Delete': {
                    const deleteBot = await handlers_1.botDeleted(Bot, message);
                    await handle({ type: 'BotRemoved', bot: deleteBot });
                    break;
                }
                case 'PostAdded': {
                    const result = await handlers_1.postAdded(Bot, message);
                    if (result) {
                        await handle({ type: 'Message4Bot', ...result });
                    }
                    break;
                }
                case 'GroupLeft':
                    const info = await handlers_1.groupLeft(message);
                    await handle({
                        type: 'BotGroupLeft',
                        ...info
                    });
                    break;
                case 'GroupJoined': {
                    const botId = message.ownerId;
                    const joinGroupBot = await Bot.findByPk(botId);
                    const groupId = message.body.id;
                    await handle({
                        type: 'BotJoinGroup',
                        bot: joinGroupBot,
                        group: { id: groupId },
                    });
                    break;
                }
                default:
                    break;
            }
            await handle({ type: body.eventType, message });
        }
        res.header('Validation-Token', req.header('Validation-Token'));
        res.send('');
    });
    return app;
};
exports.default = createApp;
//# sourceMappingURL=bot.js.map