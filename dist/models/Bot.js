"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
const core_1 = __importDefault(require("@rc-ex/core"));
const wait_for_async_1 = __importDefault(require("wait-for-async"));
const form_data_1 = __importDefault(require("form-data"));
const RestException_1 = __importDefault(require("@rc-ex/core/lib/RestException"));
const sequelize_2 = __importDefault(require("./sequelize"));
const Bot = sequelize_2.default.define('bot', {
    id: {
        type: sequelize_1.default.STRING,
        primaryKey: true,
    },
    token: {
        type: sequelize_1.default.JSON,
    },
    data: {
        // all other data associated with this bot
        type: sequelize_1.default.JSON,
    },
});
Bot.init = async (initOptions) => {
    const code = initOptions.code;
    const token = initOptions.token;
    console.log(`getting code ${code}`);
    console.log(`getting token ${token}`);
    console.log(`rc ${JSON.stringify({
        clientId: process.env.RINGCENTRAL_CHATBOT_CLIENT_ID,
        clientSecret: process.env.RINGCENTRAL_CHATBOT_CLIENT_SECRET,
        server: process.env.RINGCENTRAL_SERVER,
    }, null, 2)}`);
    const rc = new core_1.default({
        clientId: process.env.RINGCENTRAL_CHATBOT_CLIENT_ID,
        clientSecret: process.env.RINGCENTRAL_CHATBOT_CLIENT_SECRET,
        server: process.env.RINGCENTRAL_SERVER,
    });
    if (code) {
        console.log('[PUBLIC]rc authorizing...');
        console.log(`req ${JSON.stringify({
            code,
            redirect_uri: process.env.RINGCENTRAL_CHATBOT_SERVER + '/bot/oauth',
        }, null, 2)}`);
        // public bot
        await rc.authorize({
            code,
            redirect_uri: process.env.RINGCENTRAL_CHATBOT_SERVER + '/bot/oauth',
        });
        console.log(`RC token: ${rc.token}`);
        const token = rc.token;
        /*
        {
          access_token: 'xxxxxx',
          token_type: 'bearer',
          expires_in: 2147483647,
          scope: 'EditExtensions SubscriptionWebhook Glip Accounts',
          owner_id: '266262004',
          endpoint_id: 'p7GZlEVHRwKDwbx6UkH0YQ'
        }
        */
        console.log('[PUBLIC]rc authorized');
        return Bot.create({
            id: token.owner_id,
            token,
        });
    }
    else if (token) {
        console.log('[PRIVATE]rc authorizing...');
        // private bot
        /*
        {
          access_token: 'xxxxxx',
          creator_extension_id: '230919004',
          creator_account_id: '230919004',
          client_id: 'zNzIRgPiSbylEoW89Daffg'
        }
        */
        rc.token = token;
        const r = await rc.get('/restapi/v1.0/account/~/extension/~');
        const id = r.data.id.toString();
        console.log('[PRIVATE]rc authorized');
        return Bot.create({
            id,
            token: { ...token, owner_id: id },
        });
    }
    return undefined;
};
Object.defineProperty(Bot.prototype, 'rc', {
    get: function () {
        const rc = new core_1.default({
            clientId: process.env.RINGCENTRAL_CHATBOT_CLIENT_ID,
            clientSecret: process.env.RINGCENTRAL_CHATBOT_CLIENT_SECRET,
            server: process.env.RINGCENTRAL_SERVER,
        });
        rc.token = this.token;
        return rc;
    },
});
Bot.prototype.check = async function () {
    try {
        await this.rc.restapi().account().extension().get();
        return true;
    }
    catch (e) {
        if (!(e instanceof RestException_1.default)) {
            throw e;
        }
        const err = e;
        if (!err.response.data) {
            throw e;
        }
        const errorCode = e.response.data.errorCode;
        if (errorCode === 'OAU-232' || errorCode === 'CMN-405') {
            await this.remove();
            console.log(`Bot check: bot user ${this.id} had been deleted`);
            return false;
        }
        throw e;
    }
};
Bot.prototype.ensureWebHook = async function () {
    const subs = (await this.rc.restapi().subscription().list()).records.filter(sub => {
        var _a;
        return ((_a = sub.deliveryMode) === null || _a === void 0 ? void 0 : _a.address) ===
            process.env.RINGCENTRAL_CHATBOT_SERVER + '/bot/webhook';
    });
    let hasActiveSub = false;
    for (const sub of subs) {
        if (hasActiveSub || sub.status !== 'Active') {
            await this.rc.delete(`/restapi/v1.0/subscription/${sub.id}`);
        }
        else {
            hasActiveSub = true;
        }
    }
    if (!hasActiveSub) {
        await this.setupWebHook();
    }
};
Bot.prototype.setupWebHook = async function () {
    let done = false;
    let attemptCount = 0;
    while (!done) {
        try {
            attemptCount++;
            console.log(`starting attempt ${attemptCount}...`);
            await this.rc.post('/restapi/v1.0/subscription', {
                eventFilters: [
                    '/restapi/v1.0/glip/posts',
                    '/restapi/v1.0/glip/groups',
                    '/restapi/v1.0/account/~/extension/~',
                ],
                expiresIn: 473040000,
                deliveryMode: {
                    transportType: 'WebHook',
                    address: process.env.RINGCENTRAL_CHATBOT_SERVER + '/bot/webhook',
                },
            });
            done = true;
            console.log('attempt successful');
        }
        catch (e) {
            if (!(e instanceof RestException_1.default)) {
                throw e;
            }
            const err = e;
            if (!err.response.data) {
                throw e;
            }
            const errorCode = e.response.data.errorCode;
            if (errorCode === 'SUB-406') {
                await wait_for_async_1.default({ interval: 10000 });
                continue;
            }
            throw e;
        }
    }
};
Bot.prototype.sendMessage = async function (groupId, messageObj) {
    const r = await this.rc.post(`/restapi/v1.0/glip/groups/${groupId}/posts`, messageObj);
    return r.data;
};
Bot.prototype.sendAdaptiveCard = async function (groupId, body) {
    const r = await this.rc.post(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`, body);
    return r.data;
};
Bot.prototype.updateAdaptiveCard = async function (postId, body) {
    const r = await this.rc.put(`/restapi/v1.0/glip/adaptive-cards/${postId}`, body);
    return r.data;
};
Bot.prototype.getGroup = async function (groupId) {
    try {
        const r = await this.rc.get(`/restapi/v1.0/glip/groups/${groupId}`);
        return r.data;
    }
    catch (e) {
        if (!(e instanceof RestException_1.default)) {
            throw e;
        }
        const err = e;
        if (err.status === 404) {
            return undefined;
        }
        throw e;
    }
};
Bot.prototype.remove = async function () {
    await Bot.destroy({
        where: {
            id: this.id
        }
    });
};
Bot.prototype.rename = async function (newName) {
    await this.rc.put('/restapi/v1.0/account/~/extension/~', {
        contact: { firstName: newName },
    });
};
Bot.prototype.setAvatar = async function (data, name) {
    const formData = new form_data_1.default();
    formData.append('image', data, name);
    await this.rc.put('/restapi/v1.0/account/~/extension/~/profile-image', formData, {
        headers: formData.getHeaders(),
    });
};
Bot.prototype.getUser = async function (userId) {
    let r = await this.rc.get(`/restapi/v1.0/glip/persons/${userId}`);
    const glip = r.data;
    let rc;
    if (!glip.id.startsWith('glip-')) {
        r = await this.rc.get(`/restapi/v1.0/account/${glip.companyId}/extension/${glip.id}`);
        rc = r.data;
    }
    return { glip, rc };
};
Bot.prototype.getSubscriptions = async function () {
    const r = await this.rc.get('/restapi/v1.0/subscription');
    return r.data.records;
};
Bot.prototype.updateToken = async function (token) {
    this.token.access_token = token;
    this.changed && this.changed('token', true);
    await Bot.update({
        token: this.token
    }, {
        where: {
            id: this.id
        }
    });
};
exports.default = Bot;
//# sourceMappingURL=Bot.js.map