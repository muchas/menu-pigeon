export default class Config {
    private readonly values: any;

    constructor(initial: object = {}) {
        this.values = initial;
    }

    public has(key: string): boolean {
        return key in this.values;
    }

    public get(key: string): any {
        return this.values[key];
    }

    public set(key: string, value: any): void {
        this.values[key] = value;
    }
}
