import { Message } from '../types';
export declare const groupLeft: (message: Message) => Promise<{
    bot: {
        id: string;
    };
    group: {
        id: string;
    };
}>;
