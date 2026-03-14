import { ZodError, type ZodObject, type z } from 'zod';
import { buildRawConfig } from './internal/buildRawConfig';
import { formatError } from './internal/formatError';
import { loadEnv } from './internal/loadEnv';
import type { BootOptions } from './internal/types';
import { walkSchema } from './internal/walkSchema';

/**
 * Build a typed config object from a Zod schema and environment variables.
 *
 * @param schema - Zod object schema describing the config shape.
 * @param options - Boot options for environment loading.
 * @returns The parsed config object.
 * @remarks
 * Throws a formatted error when schema validation fails.
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { defineConfig, env } from '@axm-internal/config-schema';
 *
 * const config = defineConfig(
 *   z.object({
 *     port: env('PORT', z.coerce.number()),
 *   }),
 * );
 * ```
 */
export function defineConfig<T extends ZodObject>(schema: T, options?: BootOptions): z.infer<T> {
    if (options?.envDir) {
        loadEnv(options.envDir);
    }

    const tree = walkSchema(schema);
    const raw = buildRawConfig(tree);

    try {
        return schema.parse(raw);
    } catch (err) {
        if (err instanceof ZodError) {
            throw formatError(err, tree);
        }
        throw err;
    }
}
