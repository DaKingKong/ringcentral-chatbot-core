import { BotConfig } from './types';
export declare const extendApp: (app: any, skills?: {
    handle: Function;
    app?: any;
}[], handle?: Function | undefined, config?: BotConfig) => any;
