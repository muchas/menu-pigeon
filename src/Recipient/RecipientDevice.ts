import {Device} from 'queue/lib/Messages/Recipient';

export class RecipientDevice implements Device {

    constructor(public pushToken: string,
                public readonly createdAt: Date) {}
}
