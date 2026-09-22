/**
 * @system signal-shutdown
 * @status handwritten
 * @edit edit directly
 */

import type { ShutdownPhase, ShutdownPhaseInfo } from "./types.ts";

class ShutdownRegistryImpl {
	private readonly phases = new Map<string, ShutdownPhase>();
	private readonly disabled = new Set<string>();
	private installed = false;
	private defaultPhaseTimeoutMs = 5_000;

	register(phase: ShutdownPhase): void {
		if (this.phases.has(phase.name)) {
			throw new Error(
				`@teamscala/signal-shutdown: duplicate phase name "${phase.name}"`,
			);
		}
		this.phases.set(phase.name, phase);
	}

	getAll(): ShutdownPhaseInfo[] {
		return Array.from(this.phases.values())
			.map((p) => ({
				name: p.name,
				order: p.order,
				timeoutMs: p.timeoutMs ?? this.defaultPhaseTimeoutMs,
				enabled: !this.disabled.has(p.name),
			}))
			.sort((a, b) => a.order - b.order);
	}

	disable(name: string): void {
		this.disabled.add(name);
	}

	enable(name: string): void {
		this.disabled.delete(name);
	}

	/** Enabled phases (with handlers), sorted order-ascending, timeouts resolved. */
	getRunnablePhases(): Array<{
		name: string;
		order: number;
		handler: () => Promise<void>;
		timeoutMs: number;
	}> {
		return Array.from(this.phases.values())
			.filter((p) => !this.disabled.has(p.name))
			.map((p) => ({
				name: p.name,
				order: p.order,
				handler: p.handler,
				timeoutMs: p.timeoutMs ?? this.defaultPhaseTimeoutMs,
			}))
			.sort((a, b) => a.order - b.order);
	}

	markInstalled(): boolean {
		if (this.installed) return false;
		this.installed = true;
		return true;
	}

	setDefaultTimeout(ms: number): void {
		this.defaultPhaseTimeoutMs = ms;
	}
}

export const shutdownRegistry = new ShutdownRegistryImpl();
