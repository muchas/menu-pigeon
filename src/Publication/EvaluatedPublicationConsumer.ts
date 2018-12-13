import {Consumer, Job} from "queue";


export class EvaluatedPublicationConsumer implements Consumer {

    consume(job: Job): Promise<void> {
        return undefined;
    }
}
