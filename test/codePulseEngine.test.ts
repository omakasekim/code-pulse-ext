import { describe, expect, it } from "vitest";
import {
  BLAST_PRESETS,
  CADENCE_PROFILES,
  analyzeCommitCadence,
  computeBlastRadius,
} from "../src/core/codePulseEngine";

describe("code-pulse-ext engine", () => {
  it("computes multi-hop blast radius distances and maintainer owners", () => {
    const linux = BLAST_PRESETS.find((p) => p.id === "linux-kernel")!;
    const res = computeBlastRadius(linux, "mm-page");
    expect(res.distances["mm-page"]).toBe(0);
    expect(res.distances["skbuff"]).toBe(1);
    expect(res.distances["io-uring"]).toBeGreaterThanOrEqual(2);
    expect(res.affectedCount).toBe(linux.nodes.length);
  });

  it("recalculates TensorFlow layer tensor shapes dynamically by batch size", () => {
    const tf = BLAST_PRESETS.find((p) => p.id === "tensorflow-graph")!;
    expect(tf.nodes[0].shapeFormula?.(32)).toBe("[32, 512, 1024]");
  });

  it("flags 996 crunch profiles with significantly higher burnout risk than healthy async teams", () => {
    const healthy = analyzeCommitCadence(CADENCE_PROFILES.find((c) => c.id === "healthy-oss")!);
    const crunch = analyzeCommitCadence(CADENCE_PROFILES.find((c) => c.id === "crunch-996")!);
    expect(crunch.burnoutRisk).toBeGreaterThan(healthy.burnoutRisk + 30);
    expect(crunch.verdict).toContain("996");
  });
});
