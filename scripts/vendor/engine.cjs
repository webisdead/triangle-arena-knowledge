// Extracted from the public spectator bundle. Internal names are minified.
const modules = {};
const e = {
  s(items, id) {
    const out = {};
    for (let i = 0; i < items.length; i += 3) out[items[i]] = items[i + 2];
    modules[id] = out;
  },
};
function t(e, t, l, r, i) {
  let s = new Uint8Array(e.size),
    n = [];
  for (let o of i) {
    if (s[o] || t[o] === r) continue;
    s[o] = 1;
    let i = [o],
      a = !1;
    for (let n = 0; n < i.length; n++) {
      let o = i[n];
      for (let n of ((e.neighbors[o].length < 3 || (l[o] >= 0 && l[o] !== r)) &&
        (a = !0),
      e.neighbors[o]))
        s[n] || t[n] === r || ((s[n] = 1), i.push(n));
    }
    !a && i.length <= 20 && n.push(i);
  }
  return n;
}
function l(e, t) {
  return e * e + t;
}
function r(e) {
  let t = e * e,
    r = new Int16Array(t),
    i = new Int16Array(t),
    s = [];
  for (let t = 0; t < e; t++)
    for (let n = 0; n <= 2 * t; n++) {
      let o = l(t, n);
      ((r[o] = t), (i[o] = n));
      let a = [];
      (n > 0 && a.push(l(t, n - 1)),
        n < 2 * t && a.push(l(t, n + 1)),
        n % 2 == 0
          ? t + 1 < e && a.push(l(t + 1, n + 1))
          : a.push(l(t - 1, n - 1)),
        (s[o] = a));
    }
  let o = {
      rows: e,
      size: t,
      row: r,
      col: i,
      neighbors: s,
      corners: [l(0, 0), l(e - 1, 0), l(e - 1, 2 * e - 2)],
      rotate: new Int32Array(t),
    },
    d = Array.from({ length: t }, (e, t) => a(o, t)),
    [c, u] = [e / 2, (e * n * 2) / 3],
    [f, p] = [Math.cos((2 * Math.PI) / 3), Math.sin((2 * Math.PI) / 3)];
  return (
    d.forEach(([e, t], l) => {
      var r, i, s;
      let n, a;
      o.rotate[l] =
        ((r = d),
        (i = c + (e - c) * f - (t - u) * p),
        (s = u + (e - c) * p + (t - u) * f),
        (n = 0),
        (a = 1 / 0),
        r.forEach(([e, t], l) => {
          let r = (e - i) ** 2 + (t - s) ** 2;
          r < a && ((a = r), (n = l));
        }),
        n);
    }),
    o
  );
}
function i(e, t, r) {
  let i = new Set(),
    s = (t, l) => {
      for (let r = 0; r < l; r++) t = e.rotate[t];
      return t;
    };
  for (let n = 0; n < 3; n++) {
    let o = s(t, n),
      a = e.row[o],
      d = e.col[o];
    for (let e = -r; e <= r; e++)
      d + e < 0 || d + e > 2 * a || i.add(s(l(a, d + e), (3 - n) % 3));
  }
  return [...i];
}
function s(e, t = 0.45) {
  let [l, r] = [e.rows / 2, (e.rows * n * 2) / 3],
    i = [l, r + (e.rows * n - r) * t],
    o = -1,
    d = 1 / 0;
  for (let t = 0; t < e.size; t++) {
    if (e.col[t] % 2 == 0) continue;
    let [l, r] = a(e, t),
      s = (l - i[0]) ** 2 + (r - i[1]) ** 2;
    s < d && ((d = s), (o = t));
  }
  return [o, e.rotate[o], e.rotate[e.rotate[o]]].map((t) => [
    t,
    ...e.neighbors[t],
  ]);
}
e.s(["f", 0, 20, "D", 0, t], 90194);
let n = Math.sqrt(3) / 2;
function o(e, t) {
  let l = e.row[t],
    r = e.col[t],
    i = (e.rows - 1 - l) / 2,
    s = Math.floor(r / 2),
    o = l * n,
    a = (l + 1) * n;
  return r % 2 == 0
    ? [
        [i + s, a],
        [i + s + 1, a],
        [i + s + 0.5, o],
      ]
    : [
        [i + s + 0.5, o],
        [i + s + 1.5, o],
        [i + s + 1, a],
      ];
}
function a(e, t) {
  let l = o(e, t);
  return [(l[0][0] + l[1][0] + l[2][0]) / 3, (l[0][1] + l[1][1] + l[2][1]) / 3];
}
function d(e, t) {
  let l = new Int16Array(e.size).fill(-1),
    r = [t];
  l[t] = 0;
  for (let t = 0; t < r.length; t++) {
    let i = r[t];
    for (let t of e.neighbors[i]) -1 === l[t] && ((l[t] = l[i] + 1), r.push(t));
  }
  return l;
}
e.s(
  [
    "z",
    0,
    n,
    "v",
    0,
    i,
    "a",
    0,
    a,
    "i",
    0,
    l,
    "Q",
    0,
    o,
    "r",
    0,
    r,
    "I",
    0,
    d,
    "e",
    0,
    s,
  ],
  96710,
);
let c = { supplyLines: !0, powerUps: !0, hotspots: !0, enclose: !0 },
  u = {
    deploy: {
      name: "Deploy",
      summary: "Ships your color to every cell within 2 steps.",
    },
    fluid: {
      name: "Fluid Compute",
      summary: "Two moves per tick for the next 8 ticks.",
    },
    rollback: {
      name: "Instant Rollback",
      summary: "Restores every cell you lost in the last 30 ticks.",
    },
    purge: {
      name: "Purge Cache",
      summary:
        "Wipes three lines through you back to gray, your own cells too.",
    },
  },
  f = Object.keys(u);
function p(e, t) {
  return (20 * e) / t / t;
}
function h(e) {
  let t = e >>> 0;
  return () => {
    let e = (t = (t + 0x6d2b79f5) >>> 0);
    return (
      (e = Math.imul(e ^ (e >>> 15), 1 | e)),
      (((e ^= e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ (e >>> 14)) >>> 0) /
        0x100000000
    );
  };
}
function m(e, t, l) {
  let r = new Map([[t, 0]]),
    i = [t];
  for (let t = 0; t < i.length; t++) {
    let s = i[t],
      n = r.get(s);
    if (n !== l)
      for (let t of e.neighbors[s]) r.has(t) || (r.set(t, n + 1), i.push(t));
  }
  return i;
}
function g(e) {
  return e.tick >= e.maxTicks;
}
function y(e, t) {
  let l = e.slice();
  for (let e = l.length - 1; e > 0; e--) {
    let r = Math.floor(t() * (e + 1));
    [l[e], l[r]] = [l[r], l[e]];
  }
  return l;
}
function b(e, t, l) {
  for (let r = 0; r < l; r++) t = e.rotate[t];
  return t;
}
function x(e, t) {
  let l = new e.constructor(e.length);
  for (let r = 0; r < e.length; r++) l[t[r]] = e[r];
  return l;
}
function w(e, t, l) {
  let r = e.owner[t];
  r !== l &&
    (r >= 0 && ((e.lostBy[t] = r), (e.lostAt[t] = e.tick)),
    (e.owner[t] = l),
    (e.paintedAt[t] = e.tick));
}
function v(e, t, l) {
  (e.base[l] >= 0 && e.base[l] !== t) || w(e, l, t);
}
function k(e, t) {
  return i(e.grid, t, 4).filter((t) => e.base[t] < 0);
}
function j(e, t) {
  let l = new Map();
  for (let i of t)
    try {
      var r;
      l.set(
        i,
        ((r = e.bots[i](
          (function (e, t) {
            let { grid: l } = e,
              r = e.toFrame[t],
              i = e.fromFrame[t],
              s = e.botRandom[t],
              n = e.positions.map((e) => r[e]),
              o = e.homes.map((e) => r[e]);
            return {
              me: t,
              tick: e.tick,
              maxTicks: e.maxTicks,
              rules: e.rules,
              position: n[t],
              positions: n,
              homes: o,
              base: x(e.base, r),
              owner: x(e.owner, r),
              connected: x(e.connected, r),
              scores: e.scores,
              income: e.income,
              powerUps: e.powerUps
                .map((e) => ({ ...e, cell: r[e.cell] }))
                .sort((e, t) => e.cell - t.cell),
              boosted: e.boostUntil[t] >= e.tick,
              boostUntil: e.boostUntil,
              lostBy: x(e.lostBy, r),
              lostAt: x(e.lostAt, r),
              events: e.events,
              hotspots: e.hotspotRegions
                .flat()
                .map((e) => r[e])
                .sort((e, t) => e - t),
              value: (t) => e.cellValue[i[t]],
              purgeArea: (t) => k(e, i[t]).map((e) => r[e]),
              grid: l,
              neighbors: (e) => l.neighbors[e],
              random: s,
              distancesFrom: (e) => d(l, e),
              stepToward(e, r = 1 / 0) {
                let i = n[t],
                  s = new Set([
                    ...n.filter((e, l) => l !== t),
                    ...o.filter((e, l) => l !== t),
                  ]),
                  a = new Int32Array(l.size).fill(-1),
                  d = new Int16Array(l.size),
                  c = new Uint8Array(l.size);
                c[i] = 1;
                let u = [i];
                for (let t = 0; t < u.length; t++) {
                  let n = u[t];
                  if (!(d[n] >= r)) {
                    for (let t of l.neighbors[n])
                      if (!(c[t] || s.has(t))) {
                        if (
                          ((c[t] = 1),
                          (d[t] = d[n] + 1),
                          (a[t] = n === i ? t : a[n]),
                          e(t))
                        )
                          return a[t];
                        u.push(t);
                      }
                  }
                }
                return null;
              },
            };
          })(e, i),
        )),
        "number" == typeof r && Number.isInteger(r) && r >= 0 && r < e.grid.size
          ? e.fromFrame[i][r]
          : e.positions[i]),
      );
    } catch {
      e.errors[i]++;
    }
  !(function (e, t, l) {
    let { grid: r, positions: i, homes: s } = e,
      n = i.slice();
    for (let e of t) {
      let t = i[e],
        o = l.get(e) ?? t,
        a = r.neighbors[t].includes(o) && !s.some((t, l) => t === o && l !== e);
      n[e] = a ? o : t;
    }
    let o = n.slice();
    o.forEach((t, l) => {
      t === i[l] ||
        (o
          .flatMap((e, r) => (r !== l && e === t && e !== i[r] ? [r] : []))
          .some((t) => e.scores[t] <= e.scores[l]) &&
          (n[l] = i[l]));
    });
    let a = !0;
    for (; a;) {
      a = !1;
      for (let e = 0; e < n.length; e++)
        n[e] !== i[e] &&
          i.some(
            (t, l) => l !== e && t === n[e] && (n[l] === t || n[l] === i[e]),
          ) &&
          ((n[e] = i[e]), (a = !0));
    }
    let d = t.filter((e) => n[e] !== i[e]);
    for (let t of d) ((i[t] = n[t]), v(e, t, n[t]));
    !(function (e, t) {
      let l = t.flatMap((t) => {
          let l = e.positions[t],
            r = e.powerUps.findIndex((e) => e.cell === l);
          if (r < 0) return [];
          let [{ kind: i }] = e.powerUps.splice(r, 1),
            s = { tick: e.tick, player: t, kind: i };
          return (
            e.events.push(s),
            [{ player: t, kind: i, cell: l, event: s }]
          );
        }),
        r = new Map(),
        i = (e, t) => {
          let l = r.get(e);
          r.set(e, void 0 === l || l === t ? t : -1);
        },
        s = l.map(({ player: t, kind: l }) => {
          if ("rollback" !== l) return [];
          let r = [];
          for (let l = 0; l < e.grid.size; l++)
            e.lostBy[l] === t &&
              e.tick - e.lostAt[l] <= 30 &&
              e.owner[l] !== t &&
              r.push(l);
          return r;
        });
      for (let [t, n] of (l.forEach(({ player: t, kind: l, cell: r }, n) => {
        if ("deploy" === l) for (let l of m(e.grid, r, 2)) i(l, t);
        for (let e of s[n]) i(e, t);
      }),
      r))
        n >= 0 && v(e, n, t);
      l.forEach(({ player: t, kind: l, event: r }, i) => {
        ("rollback" === l &&
          (r.cells = s[i].filter((l) => e.owner[l] === t).length),
          "fluid" === l && (e.boostUntil[t] = e.tick + 8));
      });
      let n = l.filter((e) => "purge" === e.kind),
        o = new Set();
      for (let { player: t, cell: l, event: r } of n) {
        let i = k(e, l).filter((t) => e.owner[t] >= 0);
        for (let l of ((r.cells = i.length),
        (r.own = i.filter((l) => e.owner[l] === t).length),
        i))
          o.add(l);
      }
      for (let t of o) w(e, t, -1);
    })(e, d);
  })(e, t, l);
}
function M(e) {
  let { grid: t, owner: l, connected: r } = e,
    i = r.slice();
  (r.fill(0),
    e.homes.forEach((e, i) => {
      r[e] = 1;
      let s = [e];
      for (let e = 0; e < s.length; e++)
        for (let n of t.neighbors[s[e]])
          r[n] || l[n] !== i || ((r[n] = 1), s.push(n));
    }));
  let s = e.strategies.map(() => 0);
  (e.painted.fill(0), e.stranded.fill(0));
  for (let n = 0; n < t.size; n++) {
    let t = l[n];
    !(t < 0) && (e.painted[t]++, !r[n] && (e.stranded[t]++, i[n] && s[t]++));
  }
  e.income.fill(0);
  for (let i = 0; i < t.size; i++) {
    let t = l[i];
    if (t < 0) continue;
    let s = e.rules.supplyLines && !r[i];
    e.income[t] += s
      ? e.cellValue[i] * (e.variant.strandedShare ?? 0.5)
      : e.cellValue[i];
  }
  if (e.variant.hotspotSet)
    for (let t of e.hotspotRegions) {
      let r = l[t[0]];
      r >= 0 &&
        t.every((e) => l[e] === r) &&
        (e.income[r] += e.variant.hotspotSet);
    }
  let n = p(e.tick, e.maxTicks);
  (e.income.forEach((t, l) => (e.scores[l] += t * n)),
    e.rules.supplyLines &&
      s.forEach((t, l) => {
        if (t < 5) return;
        let r = (function (e, t) {
          for (let l = 0; l < e.grid.size; l++)
            if (
              e.lostBy[l] === t &&
              e.lostAt[l] === e.tick &&
              e.owner[l] >= 0 &&
              e.owner[l] !== t
            )
              return e.owner[l];
          return -1;
        })(e, l);
        e.events.push({
          tick: e.tick,
          player: l,
          kind: "cut",
          cells: t,
          ...(r >= 0 ? { by: r } : {}),
        });
      }));
}
function S(e) {
  var l;
  if (g(e)) return;
  e.tick++;
  let r = e.strategies.map((e, t) => t);
  j(e, r);
  let i = r.filter((t) => e.boostUntil[t] >= e.tick);
  (i.length && j(e, i),
    (l = e).rules.enclose &&
      (function (e) {
        let { grid: l, owner: r } = e,
          i = new Map();
        for (let s = 0; s < e.strategies.length; s++) {
          let n = [];
          for (let t = 0; t < l.size; t++)
            r[t] === s &&
              e.paintedAt[t] === e.tick &&
              n.push(...l.neighbors[t]);
          for (let o of t(l, r, e.base, s, n))
            for (let e of o) {
              let t = i.get(e);
              i.set(e, void 0 === t || t === s ? s : -1);
            }
        }
        let s = e.strategies.map(() => 0);
        for (let [t, l] of i) {
          if (l < 0) continue;
          if (e.flippedAt[t] >= 0 && e.tick - e.flippedAt[t] <= 3) {
            e.pingPongs++;
            continue;
          }
          let i = r[t];
          (v(e, l, t),
            r[t] === l && i !== l && (s[l]++, (e.flippedAt[t] = e.tick)));
        }
        s.forEach((t, l) => {
          t >= 3 &&
            e.events.push({
              tick: e.tick,
              player: l,
              kind: "capture",
              cells: t,
            });
        });
      })(l),
    M(l),
    (function (e) {
      if (!e.rules.powerUps || e.tick % 30 != 0) return;
      let { grid: t } = e,
        l = (e) => [e, t.rotate[e], t.rotate[t.rotate[e]]],
        r = e.spawnCells.filter((t) => {
          let r = l(t);
          return (
            3 === new Set(r).size && r.every((t) => !e.positions.includes(t))
          );
        });
      if (!r.length) return;
      let i = r[Math.floor(e.random() * r.length)],
        s = e.powerUpKinds[Math.floor(e.random() * e.powerUpKinds.length)];
      e.powerUps = l(i).map((e) => ({ cell: e, kind: s }));
    })(l));
}
e.s(
  [
    "Z",
    0,
    3,
    "w",
    0,
    c,
    "v",
    0,
    2,
    "p",
    0,
    8,
    "R",
    0,
    5,
    "J",
    0,
    3,
    "s",
    0,
    u,
    "h",
    0,
    4,
    "K",
    0,
    30,
    "a",
    0,
    30,
    "l",
    0,
    function (e, t = {}) {
      let l,
        i,
        n,
        o = r(t.rows ?? 18),
        a = new Int8Array(o.size).fill(-1),
        u = e.map((e, t) => o.corners[t]),
        p = t.rules ?? c,
        g = (t.seed ?? Math.floor(0x100000000 * Math.random())) >>> 0,
        x = p.hotspots ? s(o) : [],
        w = new Uint8Array(o.size).fill(1);
      for (let e of x.flat()) w[e] = t.variant?.hotspotValue ?? 5;
      let v = {
        grid: o,
        rules: p,
        strategies: e,
        bots: e.map((e) => e.create()),
        owner: a,
        lostBy: new Int8Array(o.size).fill(-1),
        lostAt: new Int32Array(o.size).fill(-1),
        connected: new Uint8Array(o.size),
        paintedAt: new Int32Array(o.size).fill(-1),
        flippedAt: new Int32Array(o.size).fill(-1),
        pingPongs: 0,
        positions: u.slice(),
        homes: u,
        base: new Int8Array(o.size).fill(-1),
        scores: e.map(() => 0),
        income: e.map(() => 0),
        painted: e.map(() => 1),
        stranded: e.map(() => 0),
        boostUntil: e.map(() => -1),
        powerUps: [],
        powerUpKinds: t.powerUpKinds ?? f,
        spawnCells:
          ((l = o.corners.map((e) => d(o, e))),
          (n =
            0.6 *
            Math.max(
              ...(i = Array.from({ length: o.size }, (e, t) =>
                Math.min(...l.map((e) => e[t])),
              )),
            )),
          i.flatMap((e, t) => (e >= n ? [t] : []))),
        hotspotRegions: x,
        cellValue: w,
        totalValue: w.reduce((e, t) => e + t, 0),
        events: [],
        tick: 0,
        maxTicks: t.maxTicks ?? 240,
        random: h(g),
        botRandom: e.map((e, t) =>
          h(Math.imul(0x5bd1e995 ^ g, t + 1) ^ (0x9e3779b9 * t)),
        ),
        tieBreak: [],
        toFrame: [],
        fromFrame: [],
        variant: t.variant ?? {},
        errors: e.map(() => 0),
      };
      for (let e of u) {
        let t = 0;
        for (; b(o, e, t) !== o.corners[0];) t++;
        let l = new Int32Array(o.size),
          r = new Int32Array(o.size);
        for (let e = 0; e < o.size; e++) ((l[e] = b(o, e, t)), (r[l[e]] = e));
        (v.toFrame.push(l), v.fromFrame.push(r));
      }
      return (
        (v.tieBreak = y(
          e.map((e, t) => t),
          v.random,
        )),
        u.forEach((e, t) => {
          for (let l of m(o, e, 3))
            ((v.base[l] = t), (a[l] = t), (v.paintedAt[l] = 0));
        }),
        M(v),
        v
      );
    },
    "T",
    0,
    g,
    "i",
    0,
    function (e) {
      return e.scores
        .map((e, t) => ({ player: t, score: e }))
        .sort(
          (t, l) =>
            l.score - t.score ||
            e.painted[l.player] - e.painted[t.player] ||
            e.tieBreak.indexOf(t.player) - e.tieBreak.indexOf(l.player),
        );
    },
    "e",
    0,
    function (e) {
      for (; !g(e);) S(e);
      return e;
    },
    "b",
    0,
    y,
    "S",
    0,
    S,
    "y",
    0,
    p,
  ],
  76239,
);
module.exports = {
  grid: r,
  hotspots: s,
  distances: d,
  engine: modules[76239],
  createGame: modules[76239].l,
  step: S,
  run: modules[76239].e,
  ranking: modules[76239].i,
  isFinished: g,
  scoreWeight: p,
  findEnclosures: t,
  cellsWithin: m,
  purgeArea: k,
  movePhase: j,
  updateIncomeAndScore: M,
  setOwner: w,
  paint: v,
  seededRandom: h,
  geometry: modules[96710],
  enclosure: modules[90194],
};
