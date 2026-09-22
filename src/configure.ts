/**
 * @system signal-shutdown
 * @status handwritten
 * @edit edit directly
 */

import { shutdownRegistry } from "./registry.ts";
import type { ShutdownConfig } from "./types.ts";

export function configure(opts: ShutdownConfig): void {
	if (typeof opts.defaultPhaseTimeoutMs === "number") {
		shutdownRegistry.setDefaultTimeout(opts.defaultPhaseTimeoutMs);
	}
	if (opts.overrides) {
		for (const [name, override] of Object.entries(opts.overrides)) {
			if (override.enabled === false) {
				shutdownRegistry.disable(name);
			} else if (override.enabled === true) {
				shutdownRegistry.enable(name);
			}
		}
	}
}
