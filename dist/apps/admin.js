"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
const express_1 = __importDefault(require("express"));
const createApp = (handle, conf) => {
    const app = express_1.default();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    const { Bot } = conf.models || {};
    const { setupDatabase = () => null } = conf;
    app.use(express_basic_auth_1.default({
        users: {
            [process.env.RINGCENTRAL_CHATBOT_ADMIN_USERNAME]: process.env.RINGCENTRAL_CHATBOT_ADMIN_PASSWORD,
        },
        unauthorizedResponse: () => '401 Unauthorized',
    }));
    // create database tables
    // ?force=true to delete existing tables
    app.put('/setup-database', async (req, res) => {
        await setupDatabase(req.query.force === 'true');
        await handle({ type: 'SetupDatabase' });
        res.send('');
    });
    app.put('/update-token', async (req, res) => {
        const bot = (await Bot.findByPk(req.query.id));
        if (bot !== null) {
            await bot.updateToken(req.query.token.trim());
        }
        res.send('');
    });
    // "maintain": remove dead bots from database, ensure live bots have WebHooks, destroy very old cache data
    app.put('/maintain', async (req, res) => {
        const bots = (await Bot.findAll());
        for (const bot of bots) {
            if (await bot.check()) {
                await bot.ensureWebHook();
            }
        }
        await handle({ type: 'Maintain' });
        res.send('');
    });
    // provide administrator with database data for troubleshooting
    app.get('/dump-database', async (req, res) => {
        const bots = await Bot.findAll();
        res.send(bots);
    });
    // provide administrator with subscriptions data for troubleshooting
    app.get('/list-subscriptions', async (req, res) => {
        const bots = (await Bot.findAll());
        let result = '';
        for (const bot of bots) {
            result += '*****************\n';
            const subscriptions = await bot.getSubscriptions();
            result += `<pre>\n${JSON.stringify(subscriptions, null, 2)}\n</pre>\n`;
            result += '*****************\n';
        }
        res.send(result);
    });
    // create db tables if not exist
    // setupDatabase();
    return app;
};
exports.default = createApp;
//# sourceMappingURL=admin.js.map