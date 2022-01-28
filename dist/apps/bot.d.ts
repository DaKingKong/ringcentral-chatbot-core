import { BotConfig } from '../types';
declare const createApp: (handle: Function, conf: BotConfig) => import("express-serve-static-core").Express;
export default createApp;
