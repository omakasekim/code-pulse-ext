export interface PulseNode {
  id: string;
  label: string;
  meta: string;
  owner: string;
  x: number;
  y: number;
  baseParamsM?: number;
  shapeFormula?: (batch: number) => string;
  vramPerBatchMb?: number;
}

export interface BlastPreset {
  id: string;
  name: string;
  ecosystem: string;
  description: string;
  isTensor?: boolean;
  defaultRoot: string;
  nodes: PulseNode[];
  edges: Array<{ from: string; to: string; label: string }>;
}

export const BLAST_PRESETS: BlastPreset[] = [
  {
    id: "react-vue",
    name: "React / Vue Reactivity Tree",
    ecosystem: "facebook/react · vuejs/core",
    description: "Click any state store or context provider to trace downstream component re-render waves and memoization boundaries.",
    defaultRoot: "cart-store",
    nodes: [
      { id: "cart-store", label: "useCartStore()", meta: "Zustand / Pinia", owner: "store/cart.ts", x: 60, y: 185 },
      { id: "header", label: "<NavHeader />", meta: "Subscribes: count", owner: "ui/Header.tsx", x: 290, y: 70 },
      { id: "drawer", label: "<CartDrawer />", meta: "Subscribes: items[]", owner: "ui/CartDrawer.tsx", x: 290, y: 205 },
      { id: "checkout", label: "<CheckoutBar />", meta: "Subscribes: total", owner: "ui/Checkout.tsx", x: 290, y: 340 },
      { id: "badge", label: "<CartBadge />", meta: "React.memo ✓", owner: "ui/Badge.tsx", x: 540, y: 70 },
      { id: "line-item", label: "<LineItemRow />", meta: "Unmemoized ⚠", owner: "ui/LineItem.tsx", x: 540, y: 205 },
      { id: "promo", label: "<PromoEngine />", meta: "Heavy Calc ⚠", owner: "ui/Promo.tsx", x: 540, y: 340 },
      { id: "stripe", label: "<StripeButton />", meta: "External Iframe", owner: "ui/Stripe.tsx", x: 770, y: 270 },
    ],
    edges: [
      { from: "cart-store", to: "header", label: "selector" },
      { from: "cart-store", to: "drawer", label: "items" },
      { from: "cart-store", to: "checkout", label: "subtotal" },
      { from: "header", to: "badge", label: "props.n" },
      { from: "drawer", to: "line-item", label: "map()" },
      { from: "checkout", to: "promo", label: "coupon" },
      { from: "checkout", to: "stripe", label: "amount" },
      { from: "promo", to: "stripe", label: "discount" },
    ],
  },
  {
    id: "linux-kernel",
    name: "Linux Kernel MAINTAINERS",
    ecosystem: "torvalds/linux",
    description: "Inspect subsystem blast radius and required MAINTAINERS sign-offs when modifying core kernel headers or allocators.",
    defaultRoot: "mm-page",
    nodes: [
      { id: "mm-page", label: "mm/page_alloc.c", meta: "Buddy Allocator", owner: "linux-mm@kvack.org", x: 60, y: 195 },
      { id: "skbuff", label: "net/core/skbuff.c", meta: "Packet Buffers", owner: "netdev@vger.kernel", x: 300, y: 80 },
      { id: "ext4", label: "fs/ext4/inode.c", meta: "Page Cache I/O", owner: "linux-ext4@vger", x: 300, y: 205 },
      { id: "sched", label: "kernel/sched/fair.c", meta: "EEVDF Scheduler", owner: "sched-maintainers", x: 300, y: 335 },
      { id: "tcp", label: "net/ipv4/tcp_output", meta: "Zero-Copy TX", owner: "netdev@vger.kernel", x: 560, y: 80 },
      { id: "nvme", label: "drivers/nvme/core.c", meta: "DMA Scatter-Gather", owner: "linux-nvme@lists", x: 560, y: 205 },
      { id: "io-uring", label: "io_uring/rw.c", meta: "Async Ring SQE", owner: "io-uring@vger", x: 785, y: 150 },
    ],
    edges: [
      { from: "mm-page", to: "skbuff", label: "alloc_pages" },
      { from: "mm-page", to: "ext4", label: "folio_alloc" },
      { from: "mm-page", to: "sched", label: "numa_hint" },
      { from: "skbuff", to: "tcp", label: "skb_clone" },
      { from: "ext4", to: "nvme", label: "submit_bio" },
      { from: "nvme", to: "io-uring", label: "cqe_post" },
      { from: "tcp", to: "io-uring", label: "send_zc" },
    ],
  },
  {
    id: "flutter-tree",
    name: "Flutter Widget & Repaint Tree",
    ecosystem: "flutter/flutter",
    description: "Visualize BoxConstraints propagation and how RepaintBoundary isolates high-FPS canvas animations from ancestor rebuilds.",
    defaultRoot: "scaffold",
    nodes: [
      { id: "scaffold", label: "Scaffold", meta: "Tight Constraints", owner: "material/scaffold.dart", x: 60, y: 195 },
      { id: "layout", label: "LayoutBuilder", meta: "Responsive Break", owner: "widgets/layout.dart", x: 295, y: 195 },
      { id: "sliver", label: "CustomScrollView", meta: "SliverConstraints", owner: "widgets/scroll.dart", x: 530, y: 105 },
      { id: "repaint", label: "RepaintBoundary", meta: "Isolated Layer ✓", owner: "rendering/proxy.dart", x: 530, y: 295 },
      { id: "list-tile", label: "SliverList Tiles", meta: "Viewport Culled", owner: "widgets/sliver.dart", x: 765, y: 105 },
      { id: "custom-paint", label: "CustomPaint 120Hz", meta: "Impeller Metal", owner: "rendering/paint.dart", x: 765, y: 295 },
    ],
    edges: [
      { from: "scaffold", to: "layout", label: "constraints" },
      { from: "layout", to: "sliver", label: "maxWidth" },
      { from: "layout", to: "repaint", label: "layer" },
      { from: "sliver", to: "list-tile", label: "buildChild" },
      { from: "repaint", to: "custom-paint", label: "rasterCache" },
    ],
  },
  {
    id: "tensorflow-graph",
    name: "TensorFlow / Transformer Shapes",
    ecosystem: "tensorflow/tensorflow · pytorch",
    description: "Adjust batch size to inspect live layer-by-layer tensor dimensions, parameter budgets, and FP16 activation VRAM.",
    isTensor: true,
    defaultRoot: "embed",
    nodes: [
      { id: "embed", label: "TokenEmbedding", meta: "Vocab 32k → 1024", owner: "tf.keras.layers", x: 55, y: 195, baseParamsM: 32.8, shapeFormula: (b) => `[${b}, 512, 1024]`, vramPerBatchMb: 12 },
      { id: "attn", label: "MultiHeadAttention", meta: "16 Heads · QKV", owner: "tf.nn.scaled_dot", x: 295, y: 110, baseParamsM: 12.6, shapeFormula: (b) => `[${b}, 16, 512, 64]`, vramPerBatchMb: 46 },
      { id: "norm", label: "RMSNorm + Residual", meta: "Fused Kernel", owner: "xla/fusion", x: 295, y: 290, baseParamsM: 0.4, shapeFormula: (b) => `[${b}, 512, 1024]`, vramPerBatchMb: 10 },
      { id: "ffn", label: "SwiGLU FFN", meta: "1024 → 4096 → 1024", owner: "tf.keras.Dense", x: 550, y: 195, baseParamsM: 37.7, shapeFormula: (b) => `[${b}, 512, 4096]`, vramPerBatchMb: 52 },
      { id: "logits", label: "LM Head Softmax", meta: "FP32 Loss Cast", owner: "tf.nn.softmax", x: 785, y: 195, baseParamsM: 32.8, shapeFormula: (b) => `[${b}, 512, 32000]`, vramPerBatchMb: 64 },
    ],
    edges: [
      { from: "embed", to: "attn", label: "FP16" },
      { from: "embed", to: "norm", label: "residual" },
      { from: "attn", to: "ffn", label: "proj" },
      { from: "norm", to: "ffn", label: "skip" },
      { from: "ffn", to: "logits", label: "hidden" },
    ],
  },
];

export interface BlastResult {
  distances: Record<string, number>;
  affectedCount: number;
  blastPct: number;
  owners: string[];
}

export function computeBlastRadius(preset: BlastPreset, rootId: string): BlastResult {
  const distances: Record<string, number> = { [rootId]: 0 };
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const dist = distances[cur];
    for (const edge of preset.edges) {
      if (edge.from === cur && !(edge.to in distances)) {
        distances[edge.to] = dist + 1;
        queue.push(edge.to);
      }
    }
  }
  const affectedNodes = preset.nodes.filter((n) => n.id in distances);
  const owners = Array.from(new Set(affectedNodes.map((n) => n.owner)));
  return {
    distances,
    affectedCount: affectedNodes.length,
    blastPct: Math.round((affectedNodes.length / Math.max(1, preset.nodes.length)) * 100),
    owners,
  };
}

export interface JsScopeFrame {
  line: number;
  title: string;
  explanation: string;
  thisBinding: string;
  scopes: Array<{ name: string; bindings: string[] }>;
  heap: string[];
}

export interface JsScopeScenario {
  id: string;
  name: string;
  code: string[];
  frames: JsScopeFrame[];
}

export const JS_SCOPE_SCENARIOS: JsScopeScenario[] = [
  {
    id: "closure-counter",
    name: "Closure & Lexical Environment",
    code: [
      "function makeCounter(start = 0) {",
      "  let count = start;",
      "  return function inc() {",
      "    count += 1;",
      "    return count;",
      "  };",
      "}",
      "const next = makeCounter(10);",
      "next(); // -> 11",
    ],
    frames: [
      {
        line: 8,
        title: "Invoke makeCounter(10)",
        explanation: "A new LexicalEnvironment is created for makeCounter with start=10 and count=10.",
        thisBinding: "undefined (strict mode)",
        scopes: [
          { name: "Global Scope", bindings: ["makeCounter: fn", "next: <uninitialized>"] },
          { name: "makeCounter() Env", bindings: ["start: 10", "count: 10"] },
        ],
        heap: ["0xA1: Closure(inc) [[Environment]] -> makeCounter Env"],
      },
      {
        line: 3,
        title: "Return Inner Function inc()",
        explanation: "makeCounter pops off the call stack, but count survives on the heap because inc.[[Environment]] retains it.",
        thisBinding: "undefined",
        scopes: [
          { name: "Global Scope", bindings: ["makeCounter: fn", "next: 0xA1 (inc)"] },
          { name: "Retained Closure Env", bindings: ["count: 10 (heap-allocated)"] },
        ],
        heap: ["0xA1: inc() -> holds live reference to count@0xB4"],
      },
      {
        line: 4,
        title: "Execute next() → Mutate Captured count",
        explanation: "Identifier lookup misses inc's local scope and resolves count in its lexical parent environment (10 → 11).",
        thisBinding: "undefined",
        scopes: [
          { name: "Global Scope", bindings: ["next: 0xA1"] },
          { name: "Retained Closure Env", bindings: ["count: 11 (mutated)"] },
          { name: "inc() Call Frame", bindings: ["<no local vars>"] },
        ],
        heap: ["0xB4: count = 11", "Return value: 11"],
      },
    ],
  },
  {
    id: "prototype-this",
    name: "Prototype Chain & `this` Binding",
    code: [
      "const proto = { greet() { return `Hi ${this.name}`; } };",
      "const dev = Object.create(proto);",
      "dev.name = 'Ada';",
      "dev.greet(); // Implicit binding: this === dev",
      "const detached = dev.greet;",
      "detached(); // Lost binding: this === undefined",
    ],
    frames: [
      {
        line: 2,
        title: "Object.create(proto) Link",
        explanation: "Creates empty object dev whose internal [[Prototype]] slot points directly to proto.",
        thisBinding: "globalThis",
        scopes: [{ name: "Module Scope", bindings: ["proto: 0x10", "dev: 0x20"] }],
        heap: ["0x10 proto: { greet: fn }", "0x20 dev: { [[Prototype]]: 0x10 }"],
      },
      {
        line: 4,
        title: "Property Delegation + Implicit `this`",
        explanation: "Engine checks dev.greet (miss) → follows [[Prototype]] to proto.greet (hit), binding `this` to call-site receiver `dev`.",
        thisBinding: "dev (0x20 { name: 'Ada' })",
        scopes: [
          { name: "Module Scope", bindings: ["proto: 0x10", "dev: 0x20"] },
          { name: "greet() Frame", bindings: ["this: dev", "return: 'Hi Ada'"] },
        ],
        heap: ["0x20 dev: { name: 'Ada', [[Prototype]]: 0x10 }"],
      },
      {
        line: 6,
        title: "Detached Reference Loses `this`",
        explanation: "Calling detached() without an object prefix drops implicit receiver binding; in strict mode `this` becomes undefined.",
        thisBinding: "undefined (TypeError on this.name)",
        scopes: [
          { name: "Module Scope", bindings: ["detached: proto.greet"] },
          { name: "detached() Frame", bindings: ["this: undefined ⚠"] },
        ],
        heap: ["Fix: dev.greet.bind(dev) or arrow wrapper () => dev.greet()"],
      },
    ],
  },
];

export interface CadenceProfile {
  id: string;
  name: string;
  ecosystem: string;
  busFactor: number;
  topAuthorSharePct: number;
  matrix: number[][]; // 7 days (Mon..Sun) x 24 hours
}

function makeMatrix(seed: "healthy" | "crunch" | "solo"): number[][] {
  return Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hr) => {
      const isWeekend = day >= 5;
      const isWorkHr = hr >= 9 && hr <= 18;
      if (seed === "healthy") {
        if (isWeekend) return hr === 11 ? 1 : 0;
        return isWorkHr ? ((day * 3 + hr * 5) % 6) + 2 : hr === 19 ? 1 : 0;
      }
      if (seed === "crunch") {
        // 996.ICU signature: heavy 9am-10pm Mon-Sat + late night & weekend spikes
        if (day === 6) return hr >= 10 && hr <= 22 ? 6 : 1;
        if (day === 5) return hr >= 9 && hr <= 23 ? 7 : 1;
        return hr >= 20 || hr <= 1 ? 8 : hr >= 9 && hr <= 19 ? ((day * 5 + hr * 3) % 4) + 3 : 0;
      }
      // solo maintainer: late evenings + weekends
      return isWeekend && hr >= 10 && hr <= 22 ? 6 : hr >= 20 || hr <= 1 ? 5 : 1;
    })
  );
}

export const CADENCE_PROFILES: CadenceProfile[] = [
  { id: "healthy-oss", name: "Healthy Async Team", ecosystem: "Sustainable OSS", busFactor: 5, topAuthorSharePct: 26, matrix: makeMatrix("healthy") },
  { id: "crunch-996", name: "Pre-Launch Crunch (996 Alert)", ecosystem: "996.ICU Detector", busFactor: 3, topAuthorSharePct: 48, matrix: makeMatrix("crunch") },
  { id: "solo-hero", name: "Bus-Factor-1 Maintainer", ecosystem: "Maintainer Risk", busFactor: 1, topAuthorSharePct: 87, matrix: makeMatrix("solo") },
];

export function analyzeCommitCadence(profile: CadenceProfile) {
  let total = 0;
  let afterHours = 0;
  let weekend = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = profile.matrix[d][h];
      total += v;
      if (d >= 5) weekend += v;
      if (h < 8 || h >= 20) afterHours += v;
    }
  }
  const afterHoursPct = total ? Math.round((afterHours / total) * 100) : 0;
  const weekendPct = total ? Math.round((weekend / total) * 100) : 0;
  const burnoutRisk = Math.min(100, Math.round(afterHoursPct * 1.15 + weekendPct * 1.1 + (profile.busFactor <= 1 ? 22 : 0)));
  const verdict = burnoutRisk >= 65 ? "HIGH BURNOUT / 996 RISK" : burnoutRisk >= 35 ? "ELEVATED CRUNCH" : "HEALTHY CADENCE";
  return { total, afterHoursPct, weekendPct, burnoutRisk, verdict };
}
