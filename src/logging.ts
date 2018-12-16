import * as raven from 'raven';
import * as winston from 'winston';
import * as winstonGraylog from 'winston-graylog2';
import Config from './Config';

// @ts-ignore
winston.level = 'info';

class SentryTransport extends winston.Transport {
    public log(level: any, msg: any, meta: any, callback: any): void {
        if (meta instanceof Error) {
            raven.captureException(meta);
        }

        callback();
    }
}

export const setupLogging = (config: Config) => {
    if (config.get('SENTRY_DSN')) {
        raven.config(config.get('SENTRY_DSN')).install();
        // @ts-ignore
        winston.add(SentryTransport);
    }

    if (config.get('GRAYLOG_HOSTNAME')) {
        winston.add(winstonGraylog, {
            graylog: {
                servers: [{
                    host: config.get('GRAYLOG_HOSTNAME'),
                    port: config.get('GRAYLOG_PORT'),
                }],
                facility: config.get('APP_NAME'),
            },
        });
    }
};
