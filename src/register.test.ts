// @system codegen
// @status generated
// @edit change the suite in the owned-suites band, then re-run codegen. Hand-edits are overwritten.
//
// This suite's assertions are OWNED by the codegen band: the band module
// carries them verbatim, this file is the emission, and hand edits here are
// overwritten on the next run. The rationale each assertion carries moved
// with it into the band.

import { describe, expect, test } from "bun:test";
import { registerShutdownPhase, runShutdownPhases } from "./register.ts";
import { shutdownRegistry } from "./registry.ts";

describe("@teamscala/signal-shutdown", () => {
	test("runs enabled phases in ascending order", async () => {
		const seen: string[] = [];
		registerShutdownPhase("ord:c", {
			order: 33,
			handler: async () => {
				seen.push("c");
			},
		});
		registerShutdownPhase("ord:a", {
			order: 11,
			handler: async () => {
				seen.push("a");
			},
		});
		registerShutdownPhase("ord:b", {
			order: 22,
			handler: async () => {
				seen.push("b");
			},
		});
		await runShutdownPhases();
		expect(seen).toEqual(["a", "b", "c"]);
	});

	test("a throwing phase does not block later phases", async () => {
		let ranAfter = false;
		registerShutdownPhase("throw:bad", {
			order: 40,
			handler: async () => {
				throw new Error("boom");
			},
		});
		registerShutdownPhase("throw:after", {
			order: 41,
			handler: async () => {
				ranAfter = true;
			},
		});
		await runShutdownPhases();
		expect(ranAfter).toBe(true);
	});

	test("a phase exceeding its timeout is abandoned; later phases still run", async () => {
		let ranAfter = false;
		registerShutdownPhase("to:hang", {
			order: 50,
			timeoutMs: 40,
			handler: () => new Promise<void>(() => {}),
		});
		registerShutdownPhase("to:after", {
			order: 51,
			handler: async () => {
				ranAfter = true;
			},
		});
		const start = Date.now();
		await runShutdownPhases();
		expect(ranAfter).toBe(true);
		expect(Date.now() - start).toBeLessThan(5000);
	});

	test("disabled phase is skipped", async () => {
		let ran = false;
		registerShutdownPhase("dis:p", {
			order: 60,
			handler: async () => {
				ran = true;
			},
		});
		shutdownRegistry.disable("dis:p");
		await runShutdownPhases();
		expect(ran).toBe(false);
	});

	test("duplicate phase name throws", () => {
		registerShutdownPhase("dup:x", { order: 70, handler: async () => {} });
		expect(() =>
			registerShutdownPhase("dup:x", { order: 71, handler: async () => {} }),
		).toThrow();
	});
});
