import type { ZodType } from 'zod';

/**
 * Union of internal schema tree nodes.
 *
 * @internal
 */
export type InternalNode = InternalObjectNode | InternalLeafNode;

/**
 * Shared fields for internal schema nodes.
 *
 * @internal
 */
export interface InternalBaseNode {
    /**
     * Full path from the root, e.g. ["logger", "path"].
     *
     * @internal
     */
    path: string[];
}

/**
 * Internal node for object schemas.
 *
 * @internal
 */
export interface InternalObjectNode extends InternalBaseNode {
    /**
     * Discriminator for object nodes.
     *
     * @internal
     */
    kind: 'object';
    /**
     * Child schema nodes keyed by property name.
     *
     * @internal
     */
    children: Record<string, InternalNode>;

    /**
     * Whether the object is optional.
     *
     * @internal
     */
    optional: boolean;
}

/**
 * Internal node for leaf schemas.
 *
 * @internal
 */
export interface InternalLeafNode extends InternalBaseNode {
    /**
     * Discriminator for leaf nodes.
     *
     * @internal
     */
    kind: 'leaf';

    /**
     * The Zod schema for this value.
     *
     * @internal
     */
    schema: ZodType;

    /**
     * Explicit env binding or "auto".
     *
     * @internal
     */
    env?: string | 'auto';

    /**
     * Whether the value is optional.
     *
     * @internal
     */
    optional: boolean;
}

/**
 * Supported schema metadata for config parsing.
 *
 * @internal
 */
export type SchemaMeta = { env?: string | 'auto' };

/**
 * Options for loading environment files.
 *
 * @internal
 */
export interface BootOptions {
    /**
     * Directory that contains .env files.
     *
     * @internal
     */
    envDir?: string;
}
