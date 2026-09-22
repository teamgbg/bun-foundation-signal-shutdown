/**
 * @system signal-shutdown
 * @status handwritten
 * @edit edit directly
 */

export interface ShutdownPhase {
	name: string;
	order: number;
	handler: () => Promise<void>;
	timeoutMs?: number;
}

export interface ShutdownConfig {
	defaultPhaseTimeoutMs?: number;
	overrides?: Record<string, { enabled?: boolean }>;
}

export interface ShutdownPhaseInfo {
	name: string;
	order: number;
	timeoutMs: number;
	enabled: boolean;
}
