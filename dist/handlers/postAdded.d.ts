import { BotType, Message } from '../types';
export declare const postAdded: (Bot: any, message: Message) => Promise<{
    text: string;
    group: any;
    bot: BotType;
    userId: string;
    message: {
        id: string;
        extensionId: string;
        text: string;
        creatorId: string;
        groupId: string;
        mentions: {
            id: string;
            type: string;
        }[] | null;
        attachments?: import("../types").AttachmentType[] | undefined;
    };
} | undefined>;
