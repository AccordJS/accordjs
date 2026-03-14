/**
 * Infer an environment variable name from a config path.
 *
 * @param path - Path segments from the config root.
 * @returns Uppercased, underscore-separated env var name.
 * @remarks
 * CamelCase segments are converted to snake case.
 * @internal
 */
export const inferEnvName = (path: string[]): string =>
    path
        .join('_')
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toUpperCase();
