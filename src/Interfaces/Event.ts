import { Location } from "./Location";
import { Moment } from "moment-timezone";

export interface Event {
    id: string;
    eventType: string;
    topics: string[];
    readyTime: Moment;
    expirationTime: Moment;
    registeredAt: Moment;
    location?: Location;
    content?: any;
}
