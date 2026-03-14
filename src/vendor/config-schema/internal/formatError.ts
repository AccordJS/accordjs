import type { z } from 'zod';
import { inferEnvName } from './inferEnvName';
import type { InternalLeafNode, InternalNode } from './types';

type $ZodIssue = z.core.$ZodIssue;
type ZodError = z.ZodError;

/**
 * Format a Zod error into a config-focused message.
 *
 * @param error - Zod validation error.
 * @param root - Internal schema tree for env lookup.
 * @returns Error instance with formatted message.
 * @remarks
 * Includes env hints for leaf nodes when available.
 * @internal
 */
export const formatError = (error: ZodError, root: InternalNode): Error => {
    const lines: string[] = [];
    lines.push('ConfigError: invalid configuration\n');

    for (const issue of error.issues) {
        lines.push(formatIssue(issue, root));
    }

    return new Error(lines.join('\n'));
};

/**
 * Format a single Zod issue line with context.
 *
 * @param issue - Zod issue from the parse failure.
 * @param root - Internal schema tree for env lookup.
 * @returns Formatted issue line.
 * @remarks
 * Adds env and received details when present.
 * @internal
 */
const formatIssue = (issue: $ZodIssue, root: InternalNode): string => {
    const issuePath = issue.path.filter((segment): segment is string | number => {
        return typeof segment === 'string' || typeof segment === 'number';
    });
    const path = issuePath.join('.');
    const leaf = findLeaf(root, issuePath);

    const env = leaf?.env ? (leaf.env === 'auto' ? inferEnvName(leaf.path) : leaf.env) : undefined;

    const parts: string[] = [];

    parts.push(`- ${path || '<root>'}`);
    parts.push(`  ${issue.message}`);

    if (env) {
        parts.push(`  env: ${env}`);
    }

    if ('received' in issue) {
        parts.push(`  received: ${String((issue as { received?: unknown }).received)}`);
    }

    return parts.join('\n');
};

/**
 * Locate a leaf node for a given issue path.
 *
 * @param node - Current node in the walk.
 * @param path - Path segments from the issue.
 * @returns Matching leaf node, if any.
 * @remarks
 * Non-string segments are ignored for object lookup.
 * @internal
 */
const findLeaf = (node: InternalNode, path: (string | number)[]): InternalLeafNode | undefined => {
    if (node.kind === 'leaf') {
        return node;
    }

    const [head, ...rest] = path;
    if (typeof head !== 'string') return;

    const child = node.children[head];
    if (!child) return;

    if (rest.length === 0) {
        return child.kind === 'leaf' ? child : undefined;
    }

    return findLeaf(child, rest);
};
