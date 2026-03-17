export type PipelineStage = 'global-middleware' | 'plugin-middleware' | 'handler';

export interface PipelineTraceEntry {
    stage: PipelineStage;
    name: string;
    durationMs: number;
    error?: unknown;
}

export interface PipelineContext<TEvent = unknown> {
    event: TEvent;
    eventType: string;
    pluginName?: string;
    startedAt: number;
    finishedAt?: number;
    durationMs?: number;
    trace?: PipelineTraceEntry[];
}
