"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const dynamo_sequelize_1 = __importDefault(require("dynamo-sequelize"));
let config;
if (process.env.USE_HEROKU_POSTGRES) {
    config =
        {
            dialect: 'postgres',
            protocol: 'postgres',
            dialectOptions: {
                ssl: {
                    rejectUnauthorized: false
                }
            }
        };
}
else {
    config =
        {
            dialect: 'postgres',
            logging: console.log
        };
}
const sequelize = new dynamo_sequelize_1.default(process.env.RINGCENTRAL_CHATBOT_DATABASE_CONNECTION_URI, config);
exports.default = sequelize;
//# sourceMappingURL=sequelize.js.map