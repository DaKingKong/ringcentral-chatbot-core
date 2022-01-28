"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendApp = void 0;
const bot_1 = __importDefault(require("./apps/bot"));
const admin_1 = __importDefault(require("./apps/admin"));
const models_1 = __importDefault(require("./models"));
const express_1 = __importDefault(require("express"));
const extendApp = (app, skills = [], handle, config = {
    adminRoute: '/admin',
    botRoute: '/bot',
    models: {}
}) => {
    const conf = {
        ...config,
        models: Object.assign({}, models_1.default, config.models || {})
    };
    conf.setupDatabase = async (force = false) => {
        for (const modelName in conf.models) {
            await conf.models[modelName].sync({ force });
        }
        console.log('database setup finished');
    };
    const mergedHandle = async (event) => {
        let handled = false;
        if (handle) {
            handled = await handle(event, handled);
        }
        for (const skill of skills) {
            if (skill.handle) {
                const result = await skill.handle(event, handled);
                handled = handled || result;
            }
        }
    };
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(config.adminRoute, admin_1.default(mergedHandle, conf));
    app.use(config.botRoute, bot_1.default(mergedHandle, conf));
    for (const skill of skills) {
        if (skill.app) {
            app.use('/', skill.app);
        }
    }
    app.mergedHandle = mergedHandle; // for unit testing
    return app;
};
exports.extendApp = extendApp;
//# sourceMappingURL=index.js.map