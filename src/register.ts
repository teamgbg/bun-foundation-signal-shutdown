/**
 * @system signal-shutdown
 * @status handwritten
 * @edit edit directly
 *
 * The single sanctioned ordered-shutdown surface (constitution
 * `signal-shutdown-is-the-only-signal-shutdown`). registerShutdownPhase adds a
 * named phase; runShutdownPhases runs every enabled phase order-ascending,
 * awaiting each with its per-phase timeout; installSignalHandlers wires
 * SIGTERM/SIGINT to runShutdownPhases (once) and exits after draining.
 */

import { getAppLogger } from "@teamscala/logger/app-loggers";
import { shutdownRegistry } from "./registry.ts";
import type { ShutdownPhase } from "./types.ts";

export function registerShutdownPhase(
	name: string,
	opts: Omit<ShutdownPhase, "name">,
): void {
	shutdownRegistry.register({ name, ...opts });
}

/**
 * Run all enabled phases in order-ascending, awaiting each to completion or its
 * per-phase timeout. A phase that throws or times out is logged and the next
 * phase still runs — one phase's failure must never block the rest of shutdown.
 * Exported (not just signal-driven) so shutdown can be triggered + tested
 * without sending real signals to the process.
 */
export async function runShutdownPhases(): Promise<void> {
	for (const phase of shutdownRegistry.getRunnablePhases()) {
		try {
			let timer: ReturnType<typeof setTimeout> | undefined;
			const timeout = new Promise<never>((_, reject) => {
				timer = setTimeout(
					() =>
						reject(
							new Error(`phase "${phase.name}" exceeded ${phase.timeoutMs}ms`),
						),
					phase.timeoutMs,
				);
			});
			try {
				await Promise.race([phase.handler(), timeout]);
			} finally {
				if (timer) clearTimeout(timer);
			}
		} catch (err) {
			getAppLogger().error(
				`[signal-shutdown] phase "${phase.name}" failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}
}

export function installSignalHandlers(): void {
	if (!shutdownRegistry.markInstalled()) return;
	let shuttingDown = false;
	const onSignal = async (): Promise<void> => {
		if (shuttingDown) return;
		shuttingDown = true;
		await runShutdownPhases();
		process.exit(0);
	};
	process.once("SIGTERM", () => void onSignal());
	process.once("SIGINT", () => void onSignal());
}
