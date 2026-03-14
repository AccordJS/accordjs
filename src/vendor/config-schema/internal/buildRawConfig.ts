import { inferEnvName } from './inferEnvName';
import type { InternalLeafNode, InternalNode, InternalObjectNode } from './types';

/**
 * Build a raw config object from the internal schema tree.
 *
 * @param root - Root schema node.
 * @returns Raw config object with environment-derived values.
 * @remarks
 * Only leaf nodes with resolved env values are set.
 * @internal
 */
export const buildRawConfig = (root: InternalNode): Record<string, unknown> => {
    if (root.kind !== 'object') {
        throw new Error('Root node must be an object');
    }

    return buildObject(root).value;
};

/**
 * Recursively build an object from an internal object node.
 *
 * @param node - Object node to expand.
 * @returns Raw object subtree.
 * @remarks
 * Object children are always included, leaf children are conditional.
 * @internal
 */
const buildObject = (node: InternalObjectNode): { value: Record<string, unknown>; hasValues: boolean } => {
    const out: Record<string, unknown> = {};
    let hasValues = false;

    for (const [key, child] of Object.entries(node.children)) {
        if (child.kind === 'object') {
            const childResult = buildObject(child);
            if (child.optional && !childResult.hasValues) {
                continue;
            }
            out[key] = childResult.value;
            hasValues = hasValues || childResult.hasValues;
            continue;
        }

        const resolved = resolveLeaf(child);
        if (resolved.shouldSet) {
            out[key] = resolved.value;
        }
        hasValues = hasValues || resolved.hasValue;
    }

    return { value: out, hasValues };
};

/**
 * Resolve a leaf node against process.env.
 *
 * @param node - Leaf node to resolve.
 * @returns Resolution result indicating whether to set the value.
 * @remarks
 * Optional leaves are omitted when no env value is present.
 * @internal
 */
const resolveLeaf = (node: InternalLeafNode): { shouldSet: boolean; value: unknown; hasValue: boolean } => {
    if (!node.env) {
        return { shouldSet: false, value: undefined, hasValue: false };
    }

    const envName = node.env === 'auto' ? inferEnvName(node.path) : node.env;

    const raw = process.env[envName];
    if (raw === undefined) {
        return node.optional
            ? { shouldSet: false, value: undefined, hasValue: false }
            : { shouldSet: true, value: undefined, hasValue: false };
    }

    return { shouldSet: true, value: raw, hasValue: true };
};
