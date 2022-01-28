"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botDeleted = void 0;
const botDeleted = async (Bot, message) => {
    const botId = message.body.extensionId;
    console.log(`Event: bot user ${botId} has been deleted`);
    const bot = (await Bot.findByPk(botId));
    await bot.remove();
    return bot;
};
exports.botDeleted = botDeleted;
//# sourceMappingURL=botDeleted.js.map