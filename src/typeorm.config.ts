import { Connection, createConnection, getConnectionOptions } from "typeorm";
import Config from "./Config";

export const createORMConnection = async (config: Config): Promise<Connection> => {
    const connectionOptions = await getConnectionOptions();

    return createConnection({
        ...connectionOptions,
        type: "postgres",
        host: config.get("DB_HOST"),
        port: parseInt(config.get("DB_PORT")),
        username: config.get("DB_USERNAME"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME"),
    });
};
