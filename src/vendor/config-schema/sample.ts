import { z } from 'zod';
import { defineConfig } from './defineConfig';

const appConfig = defineConfig(
    z.object({
        http: z.object({
            host: z.string().default('localhost'),
            port: z.number().default(3001),
        }),
    })
);

const { host, port } = appConfig.http;

console.log({ host, port });
