export interface PerformanceMetric {
    count: number;
    totalMs: number;
    minMs: number;
    maxMs: number;
}

export interface MetricsSnapshot {
    counts: Record<string, number>;
    performance: Record<string, PerformanceMetric & { avgMs: number }>;
}

export interface MetricsMiddlewareOptions {
    trackCounts?: boolean;
    trackPerformance?: boolean;
    getTime?: () => number;
    onRecord?: (snapshot: MetricsSnapshot) => void;
}
