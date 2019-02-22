export const toArray = async <T>(generator: AsyncIterableIterator<T>): Promise<T[]> => {
    const output = [];

    for await (const item of generator) {
        output.push(item);
    }

    return output;
};

export const max = (a, b) => (a > b ? a : b);
export const min = (a, b) => (a < b ? a : b);

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.substr(1);

export const sample = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
