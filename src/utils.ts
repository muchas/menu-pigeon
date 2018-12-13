

export async function toArray<T>(generator: AsyncIterableIterator<T>): Promise<T[]> {
    const output = [];

    for await (const item of generator) {
        output.push(item);
    }

    return output;
}
