import {Recipient} from "./Recipient";

export class RecipientRepository {
    private readonly recipients: Recipient[];

    constructor(recipients: Recipient[]) {
        this.recipients = recipients;
    }

    public async add(recipient: Recipient) {
        // TODO: add to zookeeper
        this.recipients.push(recipient);
    }

    public async findAll(): Promise<Recipient[]> {
        return this.recipients;
    }
}
