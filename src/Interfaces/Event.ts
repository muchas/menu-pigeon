import {Location} from "./Location";

export interface Event {
    id: string;
    eventType: string;
    topics: string[];
    readyTime: Date;
    expirationTime: Date;
    location?: Location,
    content?: any;
}
