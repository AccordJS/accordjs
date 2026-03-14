import type { ZodType } from 'zod';

/**
 * Tag a schema with a specific environment variable name.
 *
 * @param name - Environment variable key to read.
 * @param schema - Schema that validates the variable value.
 * @returns The same schema with env metadata attached.
 * @remarks
 * The metadata is used when building the raw config from process.env.
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { env } from '@axm-internal/config-schema';
 *
 * const port = env('PORT', z.coerce.number());
 * ```
 */
export function env<T extends ZodType>(name: string, schema: T): T {
    return schema.meta({ env: name });
}

/**
 * Tag a schema to infer its environment variable name from the config path.
 *
 * @param schema - Schema that validates the variable value.
 * @returns The same schema with auto-env metadata attached.
 * @remarks
 * The env name is inferred by the config loader using the schema path.
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { autoEnv } from '@axm-internal/config-schema';
 *
 * const config = z.object({
 *   logLevel: autoEnv(z.string()),
 * });
 * ```
 */
export function autoEnv<T extends ZodType>(schema: T): T {
    return schema.meta({ env: 'auto' });
}
