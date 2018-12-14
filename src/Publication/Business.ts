
// TODO: move to node-queue

export class Business {
    constructor(public id: string,
                public name: string) {}
}

export class PersistedPublication {
    constructor(public id: number,
                public business: Business,
                public days: string[] = []) {}
}
