import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Braces,
  Cpu,
  Flame,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";
import { WorkbenchShell, decodeHashState, type ExportBundle, type PaletteAction } from "./components/WorkbenchShell";
import {
  BLAST_PRESETS,
  CADENCE_PROFILES,
  JS_SCOPE_SCENARIOS,
  analyzeCommitCadence,
  computeBlastRadius,
} from "./core/codePulseEngine";

type ModeId = "blast" | "scope" | "cadence";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function App() {
  const initial = useMemo(
    () => decodeHashState<{ mode: ModeId; presetId: string; rootId: string; batchSize: number; profileId: string }>(),
    []
  );

  const [mode, setMode] = useState<ModeId>(initial?.mode ?? "blast");
  const [presetId, setPresetId] = useState<string>(initial?.presetId ?? BLAST_PRESETS[0].id);
  const preset = useMemo(() => BLAST_PRESETS.find((p) => p.id === presetId) ?? BLAST_PRESETS[0], [presetId]);
  const [rootId, setRootId] = useState<string>(initial?.rootId ?? preset.defaultRoot);
  const [batchSize, setBatchSize] = useState<number>(initial?.batchSize ?? 16);

  // Mode 2: JS Scope X-Ray
  const [scenarioId, setScenarioId] = useState<string>(JS_SCOPE_SCENARIOS[0].id);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Mode 3: Commit Cadence
  const [profileId, setProfileId] = useState<string>(initial?.profileId ?? CADENCE_PROFILES[1].id);

  const blast = useMemo(() => computeBlastRadius(preset, rootId), [preset, rootId]);
  const scenario = useMemo(() => JS_SCOPE_SCENARIOS.find((s) => s.id === scenarioId) ?? JS_SCOPE_SCENARIOS[0], [scenarioId]);
  const currentFrame = scenario.frames[Math.min(stepIdx, scenario.frames.length - 1)];
  const profile = useMemo(() => CADENCE_PROFILES.find((p) => p.id === profileId) ?? CADENCE_PROFILES[0], [profileId]);
  const cadence = useMemo(() => analyzeCommitCadence(profile), [profile]);

  const totalTensorVramMb = useMemo(() => {
    if (!preset.isTensor) return 0;
    return preset.nodes.reduce((acc, n) => acc + (n.vramPerBatchMb ?? 0) * batchSize, 0);
  }, [preset, batchSize]);

  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [scenarioId]);

  useEffect(() => {
    if (!playing || mode !== "scope") return;
    const t = setInterval(() => {
      setStepIdx((i) => {
        if (i >= scenario.frames.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1200);
    return () => clearInterval(t);
  }, [playing, mode, scenario.frames.length]);

  const selectPreset = (id: string) => {
    const p = BLAST_PRESETS.find((x) => x.id === id) ?? BLAST_PRESETS[0];
    setPresetId(p.id);
    setRootId(p.defaultRoot);
  };

  const renderSvgExport = () => {
    if (mode === "cadence") {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="90" viewBox="0 0 520 90">
        <rect width="520" height="90" rx="12" fill="#0F172A" stroke="#1E293B"/>
        <text x="20" y="34" fill="#F8FAFC" font-family="Inter,sans-serif" font-size="14" font-weight="700">code-pulse-ext · ${profile.name}</text>
        <text x="20" y="58" fill="#FB7185" font-family="JetBrains Mono,monospace" font-size="12">${cadence.verdict} · Risk ${cadence.burnoutRisk}/100 · Bus Factor ${profile.busFactor}</text>
      </svg>`;
    }
    const edges = preset.edges
      .map((e) => {
        const a = preset.nodes.find((n) => n.id === e.from);
        const b = preset.nodes.find((n) => n.id === e.to);
        if (!a || !b) return "";
        const hot = e.from in blast.distances && e.to in blast.distances;
        return `<line x1="${a.x + 158}" y1="${a.y + 38}" x2="${b.x}" y2="${b.y + 38}" stroke="${hot ? "#F43F5E" : "#334155"}" stroke-width="${hot ? 2.4 : 1.5}"/>`;
      })
      .join("");
    const nodes = preset.nodes
      .map((n) => {
        const hop = blast.distances[n.id];
        const color = hop === 0 ? "#F43F5E" : hop === 1 ? "#F59E0B" : hop !== undefined ? "#38BDF8" : "#334155";
        return `<g transform="translate(${n.x},${n.y})">
          <rect width="158" height="76" rx="10" fill="#0F172A" stroke="${color}" stroke-width="2"/>
          <text x="12" y="26" fill="#F8FAFC" font-family="Inter,sans-serif" font-size="11.5" font-weight="700">${n.label}</text>
          <text x="12" y="45" fill="#94A3B8" font-family="JetBrains Mono,monospace" font-size="9.5">${n.meta}</text>
          <text x="12" y="63" fill="${color}" font-family="JetBrains Mono,monospace" font-size="9.5">${hop !== undefined ? `HOP H${hop}` : "ISOLATED"}</text>
        </g>`;
      })
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="450" viewBox="0 0 980 450"><rect width="980" height="450" fill="#070B14"/>${edges}${nodes}</svg>`;
  };

  const exportBundle: ExportBundle = {
    filenameBase: `code-pulse-${preset.id}`,
    svg: renderSvgExport,
    markdown: () =>
      [
        `# code-pulse-ext Impact & Health Report`,
        ``,
        `- **Graph Preset:** ${preset.name} (\`${preset.ecosystem}\`)`,
        `- **Blast Origin:** \`${rootId}\` → ${blast.affectedCount}/${preset.nodes.length} nodes affected (${blast.blastPct}%)`,
        `- **Owners / Review Teams:** ${blast.owners.join(", ")}`,
        `- **Team Cadence (${profile.name}):** ${cadence.verdict} (${cadence.burnoutRisk}/100 risk, ${cadence.afterHoursPct}% after-hours)`,
      ].join("\n"),
    json: () => ({ presetId: preset.id, rootId, blast, batchSize, totalTensorVramMb, profile: profile.id, cadence }),
    codeLabel: "CODEOWNERS Snippet",
    codeExt: "txt",
    code: () => blast.owners.map((o) => `* ${o}`).join("\n"),
  };

  const paletteActions: PaletteAction[] = [
    ...BLAST_PRESETS.map((p) => ({
      id: `bp-${p.id}`,
      label: `Inspect Graph: ${p.name}`,
      group: "Blast Radius",
      run: () => {
        selectPreset(p.id);
        setMode("blast");
      },
    })),
    ...CADENCE_PROFILES.map((c) => ({
      id: `cad-${c.id}`,
      label: `Load Cadence: ${c.name}`,
      group: "Burnout Radar",
      run: () => {
        setProfileId(c.id);
        setMode("cadence");
      },
    })),
  ];

  return (
    <WorkbenchShell
      name="code-pulse-ext"
      subtitle="Framework & Kernel Blast-Radius · JS Scope X-Ray · Commit Burnout Heatmap"
      badge="CODE + MV3"
      accentHex="#F43F5E"
      icon={<Activity className="h-4 w-4" />}
      modes={[
        { id: "blast", label: "Blast-Radius & Tensor", shortKey: "1" },
        { id: "scope", label: "JS Scope / Closure X-Ray", shortKey: "2" },
        { id: "cadence", label: "Cadence & 996 Heatmap", shortKey: "3" },
      ]}
      activeMode={mode}
      onModeChange={(id) => setMode(id as ModeId)}
      actions={paletteActions}
      exportBundle={exportBundle}
      getShareState={() => ({ mode, presetId, rootId, batchSize, profileId })}
      onResetView={() => {
        setRootId(preset.defaultRoot);
        setBatchSize(16);
      }}
      onTogglePlay={() => mode === "scope" && setPlaying((p) => !p)}
      onStep={(dir) => mode === "scope" && setStepIdx((s) => Math.max(0, Math.min(scenario.frames.length - 1, s + dir)))}
      headerExtra={
        <div className="hidden items-center gap-2 rounded-lg border border-[#1E293B] bg-[#070B14] px-2.5 py-1 font-mono text-[11px] lg:flex">
          <span className="text-rose-400">{blast.blastPct}% blast</span>
          <span className="text-slate-600">·</span>
          <span className="text-amber-300">{blast.owners.length} owners</span>
        </div>
      }
    >
      {mode === "blast" && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] bg-[#0B1120] px-4 py-2">
              <div className="flex flex-wrap gap-1.5">
                {BLAST_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPreset(p.id)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      preset.id === p.id
                        ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
                        : "border-[#1E293B] bg-[#070B14] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {preset.isTensor && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">Batch Size:</span>
                  <input
                    type="range"
                    min={1}
                    max={64}
                    step={1}
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-28 accent-rose-500"
                  />
                  <span className="text-cyan-300">B={batchSize} ({(totalTensorVramMb / 1024).toFixed(2)} GB)</span>
                </div>
              )}
            </div>

            <div className="relative flex-1 overflow-hidden bg-[#070B14]">
              <svg className="h-full w-full" viewBox="0 0 980 440">
                <defs>
                  <pattern id="cp-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1E293B" strokeOpacity="0.35" />
                  </pattern>
                </defs>
                <rect width="980" height="440" fill="url(#cp-grid)" />
                {preset.edges.map((e) => {
                  const a = preset.nodes.find((n) => n.id === e.from);
                  const b = preset.nodes.find((n) => n.id === e.to);
                  if (!a || !b) return null;
                  const x1 = a.x + 162;
                  const y1 = a.y + 40;
                  const x2 = b.x;
                  const y2 = b.y + 40;
                  const cx = (x1 + x2) / 2;
                  const hot = e.from in blast.distances && e.to in blast.distances;
                  return (
                    <g key={`${e.from}-${e.to}`}>
                      <path
                        d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={hot ? "#F43F5E" : "#334155"}
                        strokeWidth={hot ? 2.4 : 1.5}
                        opacity={hot ? 0.95 : 0.45}
                      />
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle" fill="#64748B" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                        {e.label}
                      </text>
                    </g>
                  );
                })}
                {preset.nodes.map((node) => {
                  const hop = blast.distances[node.id];
                  const color =
                    hop === 0 ? "#F43F5E" : hop === 1 ? "#F59E0B" : hop !== undefined ? "#38BDF8" : "#334155";
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={() => setRootId(node.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        width="162"
                        height="82"
                        rx="12"
                        fill={hop === 0 ? "#241122" : "#0F172A"}
                        stroke={color}
                        strokeWidth={hop === 0 ? 2.6 : 1.7}
                      />
                      <text x="12" y="24" fill="#F8FAFC" fontSize="11.5" fontWeight="700">{node.label}</text>
                      <text x="12" y="42" fill="#94A3B8" fontSize="9.5" fontFamily="JetBrains Mono, monospace">
                        {node.shapeFormula ? node.shapeFormula(batchSize) : node.meta}
                      </text>
                      <text x="12" y="60" fill={color} fontSize="9.5" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                        {node.vramPerBatchMb
                          ? `${(node.vramPerBatchMb * batchSize).toLocaleString()} MB · ${node.baseParamsM}M`
                          : hop === 0
                            ? "● ORIGIN MUTATION (H0)"
                            : hop !== undefined
                              ? `↳ WAVE H${hop} IMPACT`
                              : "○ ISOLATED"}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <aside className="w-80 shrink-0 overflow-y-auto border-l border-[#1E293B] bg-[#0F172A] p-4 space-y-4">
            <div>
              <div className="font-mono text-[10px] uppercase text-rose-400">{preset.ecosystem}</div>
              <h2 className="mt-1 text-sm font-bold text-slate-50">{preset.name}</h2>
              <p className="mt-1 text-xs text-slate-300">{preset.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="rounded-xl border border-[#1E293B] bg-[#070B14] p-3">
                <div className="text-[10px] text-slate-400">Blast Radius</div>
                <div className="mt-1 text-base font-bold text-rose-400">{blast.blastPct}%</div>
              </div>
              <div className="rounded-xl border border-[#1E293B] bg-[#070B14] p-3">
                <div className="text-[10px] text-slate-400">Affected Nodes</div>
                <div className="mt-1 text-base font-bold text-amber-300">{blast.affectedCount} / {preset.nodes.length}</div>
              </div>
            </div>

            <div className="rounded-xl border border-[#1E293B] bg-[#070B14] p-3">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-cyan-400">
                <Zap className="h-3.5 w-3.5" /> Required Owners / Files
              </div>
              <div className="mt-2 space-y-1.5 font-mono text-[11px] text-slate-200">
                {blast.owners.map((owner) => (
                  <div key={owner} className="rounded bg-[#0F172A] px-2 py-1">{owner}</div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {mode === "scope" && (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {JS_SCOPE_SCENARIOS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setScenarioId(s.id)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                        scenario.id === s.id
                          ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
                          : "border-[#1E293B] bg-[#070B14] text-slate-400"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setStepIdx((i) => Math.max(0, i - 1))} className="rounded-lg border border-[#1E293B] bg-[#070B14] p-1.5 text-slate-300"><SkipBack className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => setPlaying((p) => !p)} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/50 bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-200">
                    {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {playing ? "Pause" : "Step Play"}
                  </button>
                  <button type="button" onClick={() => setStepIdx((i) => Math.min(scenario.frames.length - 1, i + 1))} className="rounded-lg border border-[#1E293B] bg-[#070B14] p-1.5 text-slate-300"><SkipForward className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl border border-[#1E293B] bg-[#070B14] font-mono text-xs">
                {scenario.code.map((line, i) => {
                  const ln = i + 1;
                  const active = ln === currentFrame.line;
                  return (
                    <div
                      key={ln}
                      className={`flex gap-3 px-3 py-1.5 ${active ? "bg-rose-500/20 text-rose-100" : "text-slate-300"}`}
                    >
                      <span className="w-5 text-right text-slate-500">{ln}</span>
                      <pre className="whitespace-pre-wrap">{line}</pre>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-xl border border-[#1E293B] bg-[#070B14] p-3">
                <div className="font-mono text-xs font-bold text-rose-300">
                  Step {stepIdx + 1}/{scenario.frames.length}: {currentFrame.title}
                </div>
                <p className="mt-1 text-xs text-slate-300">{currentFrame.explanation}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-6">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-100"><Braces className="h-4 w-4 text-cyan-400" /> Lexical Scope Chain</h3>
                <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] text-amber-300">this = {currentFrame.thisBinding}</span>
              </div>
              {currentFrame.scopes.map((sc) => (
                <div key={sc.name} className="rounded-xl border border-[#1E293B] bg-[#070B14] p-3">
                  <div className="font-mono text-[11px] font-bold text-violet-300">{sc.name}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {sc.bindings.map((b) => (
                      <span key={b} className="rounded bg-[#0F172A] px-2 py-0.5 text-slate-200">{b}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-[#1E293B] bg-[#070B14] p-3">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-emerald-400"><Cpu className="h-3.5 w-3.5" /> Heap Objects & Prototypes</div>
                <div className="mt-1.5 space-y-1 font-mono text-[11px] text-slate-300">
                  {currentFrame.heap.map((h) => <div key={h}>› {h}</div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "cadence" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
            <div className="flex flex-wrap gap-1.5">
              {CADENCE_PROFILES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProfileId(p.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    profile.id === p.id
                      ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
                      : "border-[#1E293B] bg-[#070B14] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-xs font-bold ${
              cadence.burnoutRisk >= 65 ? "bg-rose-500/20 text-rose-300" : cadence.burnoutRisk >= 35 ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
            }`}>
              <Flame className="h-3.5 w-3.5" /> {cadence.verdict} ({cadence.burnoutRisk}/100)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-3.5">
              <div className="font-mono text-[10px] uppercase text-slate-400">After-Hours Commits</div>
              <div className="mt-1 font-mono text-lg font-bold text-rose-400">{cadence.afterHoursPct}%</div>
            </div>
            <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-3.5">
              <div className="font-mono text-[10px] uppercase text-slate-400">Weekend Density</div>
              <div className="mt-1 font-mono text-lg font-bold text-amber-300">{cadence.weekendPct}%</div>
            </div>
            <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-3.5">
              <div className="font-mono text-[10px] uppercase text-slate-400">Bus Factor</div>
              <div className="mt-1 font-mono text-lg font-bold text-cyan-300">{profile.busFactor} engineers</div>
            </div>
            <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-3.5">
              <div className="font-mono text-[10px] uppercase text-slate-400">Top Author Share</div>
              <div className="mt-1 font-mono text-lg font-bold text-violet-300">{profile.topAuthorSharePct}%</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">7 × 24 Commit Density & 996 Crunch Heatmap</h3>
              <span className="font-mono text-[11px] text-slate-400">{cadence.total} sampled commits (local hour 00..23)</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[680px] space-y-1.5">
                <div className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-1 font-mono text-[10px] text-slate-500">
                  <span />
                  {Array.from({ length: 24 }, (_, h) => (
                    <span key={h} className="text-center">{String(h).padStart(2, "0")}</span>
                  ))}
                </div>
                {profile.matrix.map((row, dayIdx) => (
                  <div key={DAYS[dayIdx]} className="grid grid-cols-[44px_repeat(24,minmax(0,1fr))] items-center gap-1">
                    <span className="font-mono text-[11px] text-slate-400">{DAYS[dayIdx]}</span>
                    {row.map((count, hrIdx) => {
                      const isRiskHour = dayIdx >= 5 || hrIdx < 8 || hrIdx >= 20;
                      const bg =
                        count === 0
                          ? "bg-[#070B14]"
                          : isRiskHour && count >= 3
                            ? "bg-rose-500/80"
                            : count >= 7
                              ? "bg-amber-400/85"
                              : count >= 4
                                ? "bg-emerald-500/75"
                                : "bg-emerald-500/30";
                      return (
                        <div
                          key={hrIdx}
                          title={`${DAYS[dayIdx]} ${String(hrIdx).padStart(2, "0")}:00 — ${count} commits`}
                          className={`h-7 rounded border border-[#1E293B]/70 ${bg}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </WorkbenchShell>
  );
}
