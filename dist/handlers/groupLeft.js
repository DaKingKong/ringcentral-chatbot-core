"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupLeft = void 0;
const groupLeft = async (message) => {
    const botId = message.ownerId;
    const groupId = message.body.id;
    console.log('bot id:', botId, 'leaves group id', groupId);
    return {
        bot: {
            id: botId
        },
        group: {
            id: groupId
        }
    };
};
exports.groupLeft = groupLeft;
//# sourceMappingURL=groupLeft.js.map