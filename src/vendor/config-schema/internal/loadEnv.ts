import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

/**
 * Load .env files into process.env.
 *
 * @param dir - Directory containing .env files.
 * @returns Nothing.
 * @remarks
 * Loads .env first, then .env.NODE_ENV with override when NODE_ENV is set.
 * @internal
 */
export const loadEnv = (dir: string): void => {
    // Always load .env first
    const base = dotenv.config({ path: `${dir}/.env` });
    dotenvExpand.expand(base);

    const env = process.env.NODE_ENV;
    if (env) {
        const specific = dotenv.config({ path: `${dir}/.env.${env}`, override: true });
        dotenvExpand.expand(specific);
    }
};
