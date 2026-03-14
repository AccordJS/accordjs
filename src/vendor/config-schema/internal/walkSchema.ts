import { getSchemaMeta } from '@axm-internal/zod-helpers';
import { ZodDefault, ZodObject, ZodOptional, type ZodType, z } from 'zod';
import type { InternalNode, InternalObjectNode, SchemaMeta } from './types';

/**
 * Walk a root Zod schema to build the internal tree.
 *
 * @param schema - Root Zod schema.
 * @returns Internal node tree representing the schema.
 * @remarks
 * The root schema must be a Zod object.
 * @internal
 */
export function walkSchema(schema: ZodType): InternalNode {
    if (!(schema instanceof ZodObject)) {
        throw new Error('defineConfig() expects a Zod object at the root');
    }

    return walkObject(schema, [], false);
}

/**
 * Walk an object schema and its children.
 *
 * @param schema - Object schema to traverse.
 * @param path - Path segments leading to this object.
 * @returns Internal object node with populated children.
 * @remarks
 * Child paths are appended as keys are visited.
 * @internal
 */
function walkObject(schema: ZodObject, path: string[], optional: boolean): InternalObjectNode {
    const { shape } = schema;
    const children: Record<string, InternalNode> = {};

    for (const key of Object.keys(shape)) {
        const child = shape[key];
        children[key] = walkNode(child, [...path, key]);
    }

    return {
        kind: 'object',
        path,
        children,
        optional,
    };
}

/**
 * Walk a node schema into a leaf or object.
 *
 * @param schema - Schema to inspect.
 * @param path - Path segments for the schema.
 * @returns Internal node representing the schema.
 * @remarks
 * Unwraps optional/default/pipe wrappers before inspection.
 * @internal
 */
function walkNode(schema: ZodType, path: string[]): InternalNode {
    const { base, optional } = unwrap(schema);

    if (base instanceof ZodObject) {
        return walkObject(base, path, optional);
    }

    const meta = getSchemaMeta<SchemaMeta>(base);

    return {
        kind: 'leaf',
        path,
        schema: base,
        env: meta?.env,
        optional,
    };
}

/**
 * Unwrap wrapper schemas to reach the base type.
 *
 * @param schema - Schema to unwrap.
 * @returns Base schema plus optional flag.
 * @remarks
 * Default and pipe wrappers are not considered optional.
 * @internal
 */
function unwrap(schema: ZodType): {
    base: ZodType;
    optional: boolean;
} {
    let current = schema;
    let optional = false;

    while (true) {
        if (current instanceof ZodOptional) {
            optional = true;
            current = (current as ZodOptional<ZodType>).def.innerType;
            continue;
        }

        if (current instanceof ZodDefault) {
            current = (current as ZodDefault<ZodType>).def.innerType;
            continue;
        }

        if (current instanceof z.ZodPipe) {
            const { def } = current as z.ZodPipe;
            current = def.in as unknown as ZodType;
            continue;
        }

        break;
    }

    return { base: current, optional };
}
