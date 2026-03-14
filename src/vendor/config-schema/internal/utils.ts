import type { ZodType } from 'zod';

/**
 * Read the metadata object attached to a Zod schema.
 *
 * @param schema - Schema holding metadata.
 * @returns The metadata object or an empty object when absent.
 * @remarks
 * Zod metadata is optional, so this always returns a safe object.
 * @example
 * ```ts
 * const meta = getSchemaMeta<{ source: string }>(schema);
 * console.log(meta.source);
 * ```
 */
export const getSchemaMeta = <SchemaMeta extends Record<string, unknown>, T extends ZodType = ZodType>(
    schema: T
): SchemaMeta => {
    return (schema.meta() as SchemaMeta) ?? ({} as SchemaMeta);
};

/**
 * Read a single metadata value from a Zod schema.
 *
 * @param schema - Schema holding metadata.
 * @param name - Metadata key to access.
 * @returns The metadata value when present.
 * @remarks
 * Returns undefined when the metadata key is missing.
 * @example
 * ```ts
 * const source = getMetaValue<{ source: string }>(schema, "source");
 * ```
 */
export const getMetaValue = <SchemaMeta extends Record<string, unknown>, T extends ZodType>(
    schema: T,
    name: keyof SchemaMeta & string
): SchemaMeta[keyof SchemaMeta] | undefined => {
    return getSchemaMeta<SchemaMeta, T>(schema)[name];
};
