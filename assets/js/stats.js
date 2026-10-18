/*!
 * stats.js — small, dependency-free statistics helpers for the evidence-synthesis tools.
 * Works in the browser (window.Stats) and in Node (module.exports) so it can be unit-tested.
 * All formulas are referenced in tools.js next to the calculator that uses them.
 */
(function (root) {
  "use strict";

  // ---------- Normal distribution ----------
  function erf(x) {
    // W. J. Cody-style rational approximation via erfc (max rel. error ~1e-14 is not needed;
    // this Abramowitz–Stegun 7.1.26 refinement gives ~1.2e-7, enough for 3–4 decimals).
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.5 * x);
    var y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 +
      t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
      t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return sign * y;
  }
  function pnorm(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

  function qnorm(p) {
    // Peter Acklam's algorithm with one step of Halley refinement.
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
      1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
      6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
      -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
      3.754408661907416e+00];
    var pl = 0.02425, q, r, x;
    if (p < pl) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= 1 - pl) {
      q = p - 0.5; r = q * q;
      x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    var e = pnorm(x) - p;
    var u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  }

  // ---------- Gamma / Beta ----------
  function lgamma(x) {
    var g = 7, cf = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    var s = cf[0];
    for (var i = 1; i < g + 2; i++) s += cf[i] / (x + i);
    var t = x + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(s);
  }
  function betacf(x, a, b) {
    var MAXIT = 300, EPS = 3e-14, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  // Regularized incomplete beta I_x(a, b)
  function ibeta(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(x, a, b) / a;
    return 1 - bt * betacf(1 - x, b, a) / b;
  }

  // ---------- Student t ----------
  function pt(t, df) {
    if (!isFinite(df) || df > 1e7) return pnorm(t);
    var x = df / (df + t * t);
    var tail = 0.5 * ibeta(x, df / 2, 0.5);
    return t > 0 ? 1 - tail : tail;
  }
  function qt(p, df) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (!isFinite(df) || df > 1e7) return qnorm(p);
    if (p === 0.5) return 0;
    // bracket then bisect (robust for any df >= 1)
    var lo = -1, hi = 1;
    while (pt(lo, df) > p) lo *= 2;
    while (pt(hi, df) < p) hi *= 2;
    for (var i = 0; i < 200; i++) {
      var mid = (lo + hi) / 2;
      if (pt(mid, df) < p) lo = mid; else hi = mid;
      if (hi - lo < 1e-12) break;
    }
    return (lo + hi) / 2;
  }

  // ---------- Proportions ----------
  function wilson(x, n, conf) {
    conf = conf || 0.95;
    if (!(n > 0)) return [NaN, NaN];
    var z = qnorm(1 - (1 - conf) / 2), p = x / n, z2 = z * z;
    var den = 1 + z2 / n;
    var centre = (p + z2 / (2 * n)) / den;
    var half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return [Math.max(0, centre - half), Math.min(1, centre + half)];
  }
  function logCI(est, se, conf) {
    var z = qnorm(1 - (1 - (conf || 0.95)) / 2);
    return [Math.exp(Math.log(est) - z * se), Math.exp(Math.log(est) + z * se)];
  }
  function twoSidedP(z) { return 2 * (1 - pnorm(Math.abs(z))); }

  var Stats = {
    erf: erf, pnorm: pnorm, qnorm: qnorm, lgamma: lgamma, ibeta: ibeta,
    pt: pt, qt: qt, wilson: wilson, logCI: logCI, twoSidedP: twoSidedP
  };

  // ---------- Evidence-synthesis calculators (pure functions) ----------

  // Median/IQR/range -> mean & SD. Mean: Luo et al. 2018; SD: Wan et al. 2014.
  Stats.medianToMean = function (o) {
    var n = o.n, a = o.min, q1 = o.q1, m = o.median, q3 = o.q3, b = o.max;
    var has = function (v) { return typeof v === "number" && isFinite(v); };
    if (!has(n) || n < 3 || !has(m)) return { error: "needN" };
    var S1 = has(a) && has(b), S2 = has(q1) && has(q3);
    var xi = 2 * qnorm((n - 0.375) / (n + 0.25));
    var eta = 2 * qnorm((0.75 * n - 0.125) / (n + 0.25));
    var mean, sd, scenario;
    if (S1 && S2) {
      scenario = "S3";
      var w1 = 2.2 / (2.2 + Math.pow(n, 0.75)), w2 = 0.7 - 0.72 / Math.pow(n, 0.55);
      mean = w1 * (a + b) / 2 + w2 * (q1 + q3) / 2 + (1 - w1 - w2) * m;
      sd = (b - a) / (2 * xi) + (q3 - q1) / (2 * eta);
    } else if (S2) {
      scenario = "S2";
      var w = 0.7 + 0.39 / n;
      mean = w * (q1 + q3) / 2 + (1 - w) * m;
      sd = (q3 - q1) / eta;
    } else if (S1) {
      scenario = "S1";
      var w0 = 4 / (4 + Math.pow(n, 0.75));
      mean = w0 * (a + b) / 2 + (1 - w0) * m;
      sd = (b - a) / xi;
    } else return { error: "needSpread" };
    // order checks
    var ordered = [a, q1, m, q3, b].filter(has);
    for (var i = 1; i < ordered.length; i++) if (ordered[i] < ordered[i - 1]) return { error: "order" };
    // crude skew flag: Bowley (quartile) or range-based skewness
    var skew = S2 ? (q3 + q1 - 2 * m) / (q3 - q1) : (b + a - 2 * m) / (b - a);
    return { scenario: scenario, mean: mean, sd: sd, xi: xi, eta: eta, skew: skew };
  };

  // Combine k groups (Cochrane Handbook, Table 6.5.a), applied pairwise.
  Stats.combineGroups = function (groups) {
    var g = groups.filter(function (x) { return x.n > 0 && isFinite(x.mean) && isFinite(x.sd); });
    if (g.length < 2) return { error: "needTwo" };
    var N = g[0].n, M = g[0].mean, S = g[0].sd;
    for (var i = 1; i < g.length; i++) {
      var n2 = g[i].n, m2 = g[i].mean, s2 = g[i].sd;
      var Nn = N + n2;
      var Mn = (N * M + n2 * m2) / Nn;
      var Sn = Math.sqrt(((N - 1) * S * S + (n2 - 1) * s2 * s2 + (N * n2 / Nn) * (M * M + m2 * m2 - 2 * M * m2)) / (Nn - 1));
      N = Nn; M = Mn; S = Sn;
    }
    return { n: N, mean: M, sd: S };
  };

  // SD finder (Cochrane Handbook 6.5.2)
  Stats.sdFromSE = function (se, n) { return se * Math.sqrt(n); };
  Stats.sdFromCI = function (lo, hi, n, level) {
    var tq = qt(1 - (1 - level) / 2, n - 1);
    return { sd: Math.sqrt(n) * (hi - lo) / (2 * tq), q: tq, se: (hi - lo) / (2 * tq) };
  };
  Stats.sdFromMDCI = function (lo, hi, n1, n2, level) {
    var tq = qt(1 - (1 - level) / 2, n1 + n2 - 2);
    var se = (hi - lo) / (2 * tq);
    return { sd: se / Math.sqrt(1 / n1 + 1 / n2), se: se, q: tq };
  };
  Stats.sdFromP = function (p, md, n1, n2) {
    var tq = qt(1 - p / 2, n1 + n2 - 2);
    var se = Math.abs(md) / tq;
    return { sd: se / Math.sqrt(1 / n1 + 1 / n2), se: se, t: tq };
  };
  Stats.sdFromT = function (t, md, n1, n2) {
    var se = Math.abs(md) / Math.abs(t);
    return { sd: se / Math.sqrt(1 / n1 + 1 / n2), se: se, t: Math.abs(t) };
  };

  // Diagnostic accuracy from a 2x2 table
  Stats.diagnostic = function (TP, FP, FN, TN, pretest) {
    var N = TP + FP + FN + TN;
    if (!(N > 0)) return { error: "empty" };
    var r = {};
    var prop = function (x, n) { return { est: n > 0 ? x / n : NaN, ci: wilson(x, n) }; };
    r.sens = prop(TP, TP + FN);
    r.spec = prop(TN, TN + FP);
    r.ppv = prop(TP, TP + FP);
    r.npv = prop(TN, TN + FN);
    r.acc = prop(TP + TN, N);
    r.prev = prop(TP + FN, N);
    var cc = (TP === 0 || FP === 0 || FN === 0 || TN === 0) ? 0.5 : 0;
    var a = TP + cc, b = FP + cc, c = FN + cc, d = TN + cc;
    r.corrected = cc > 0;
    var se1 = a / (a + c), sp1 = d / (b + d);
    var lrp = se1 / (1 - sp1), lrn = (1 - se1) / sp1;
    var seLp = Math.sqrt(1 / a - 1 / (a + c) + 1 / b - 1 / (b + d));
    var seLn = Math.sqrt(1 / c - 1 / (a + c) + 1 / d - 1 / (b + d));
    r.lrp = { est: lrp, ci: logCI(lrp, seLp) };
    r.lrn = { est: lrn, ci: logCI(lrn, seLn) };
    var dor = (a * d) / (b * c);
    r.dor = { est: dor, ci: logCI(dor, Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)) };
    r.youden = r.sens.est + r.spec.est - 1;
    var pre = (typeof pretest === "number" && pretest > 0 && pretest < 1) ? pretest : r.prev.est;
    var odds = pre / (1 - pre);
    var postPos = odds * lrp / (1 + odds * lrp), postNeg = odds * lrn / (1 + odds * lrn);
    r.pretest = pre; r.postPos = postPos; r.postNeg = postNeg; r.N = N;
    return r;
  };

  // Binary outcome effect measures (intervention vs control)
  Stats.binaryEffects = function (e1, n1, e2, n2, conf) {
    conf = conf || 0.95;
    if (!(n1 > 0 && n2 > 0) || e1 > n1 || e2 > n2 || e1 < 0 || e2 < 0) return { error: "bad" };
    var z = qnorm(1 - (1 - conf) / 2);
    var a = e1, b = n1 - e1, c = e2, d = n2 - e2;
    var cc = (a === 0 || b === 0 || c === 0 || d === 0) ? 0.5 : 0;
    var A = a + cc, B = b + cc, C = c + cc, D = d + cc;
    var p1 = a / n1, p2 = c / n2;
    var rr = (A / (A + B)) / (C / (C + D));
    var seRR = Math.sqrt(1 / A - 1 / (A + B) + 1 / C - 1 / (C + D));
    var or = (A * D) / (B * C);
    var seOR = Math.sqrt(1 / A + 1 / B + 1 / C + 1 / D);
    var rd = p1 - p2;
    var seRD = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);
    var out = {
      p1: p1, p2: p2, corrected: cc > 0,
      rr: { est: rr, ci: [Math.exp(Math.log(rr) - z * seRR), Math.exp(Math.log(rr) + z * seRR)], p: twoSidedP(Math.log(rr) / seRR) },
      or: { est: or, ci: [Math.exp(Math.log(or) - z * seOR), Math.exp(Math.log(or) + z * seOR)], p: twoSidedP(Math.log(or) / seOR) },
      rd: { est: rd, ci: [rd - z * seRD, rd + z * seRD], p: seRD > 0 ? twoSidedP(rd / seRD) : NaN },
      rrr: 1 - rr
    };
    out.nnt = rd !== 0 ? 1 / Math.abs(rd) : Infinity;
    out.nntCrossesZero = out.rd.ci[0] < 0 && out.rd.ci[1] > 0;
    out.nntCI = out.nntCrossesZero ? null : [1 / Math.abs(out.rd.ci[1]), 1 / Math.abs(out.rd.ci[0])].sort(function (x, y) { return x - y; });
    return out;
  };

  // Standardized mean difference (Hedges' g) — Borenstein et al. 2009
  Stats.smd = function (m1, s1, n1, m2, s2, n2, conf) {
    conf = conf || 0.95;
    if (!(n1 > 1 && n2 > 1 && s1 > 0 && s2 > 0)) return { error: "bad" };
    var z = qnorm(1 - (1 - conf) / 2);
    var df = n1 + n2 - 2;
    var sp = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / df);
    var d = (m1 - m2) / sp;
    var vd = (n1 + n2) / (n1 * n2) + d * d / (2 * (n1 + n2));
    var J = 1 - 3 / (4 * df - 1);
    var g = J * d, vg = J * J * vd, seg = Math.sqrt(vg);
    var md = m1 - m2, seMD = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2);
    return {
      sp: sp, d: d, seD: Math.sqrt(vd), J: J, g: g, seG: seg, ciG: [g - z * seg, g + z * seg],
      md: md, seMD: seMD, ciMD: [md - z * seMD, md + z * seMD],
      orFromG: Math.exp(g * Math.PI / Math.sqrt(3))
    };
  };
  Stats.orToSmd = function (or) { return Math.log(or) * Math.sqrt(3) / Math.PI; };
  Stats.smdToOr = function (d) { return Math.exp(d * Math.PI / Math.sqrt(3)); };

  // Cohen's kappa for two reviewers, include/exclude
  Stats.kappa = function (a, b, c, d, conf) {
    conf = conf || 0.95;
    var n = a + b + c + d;
    if (!(n > 0)) return { error: "empty" };
    var po = (a + d) / n;
    var pe = ((a + b) * (a + c) + (c + d) * (b + d)) / (n * n);
    var k = pe === 1 ? 1 : (po - pe) / (1 - pe);
    var se = Math.sqrt(po * (1 - po) / (n * (1 - pe) * (1 - pe)));
    var z = qnorm(1 - (1 - conf) / 2);
    return { n: n, po: po, pe: pe, kappa: k, se: se, ci: [Math.max(-1, k - z * se), Math.min(1, k + z * se)], pabak: 2 * po - 1 };
  };

  // Sample size
  Stats.ssProportion = function (p, d, conf, N, deff, loss) {
    var z = qnorm(1 - (1 - conf) / 2);
    var n0 = z * z * p * (1 - p) / (d * d);
    var n = N > 0 ? n0 / (1 + (n0 - 1) / N) : n0;
    n = n * (deff || 1);
    var final = n / (1 - (loss || 0));
    return { n0: n0, n: n, final: Math.ceil(final), z: z };
  };
  Stats.ssTwoProportions = function (p1, p2, alpha, power, k, loss) {
    k = k || 1;
    var za = qnorm(1 - alpha / 2), zb = qnorm(power);
    var pbar = (p1 + k * p2) / (1 + k), qbar = 1 - pbar;
    var num = za * Math.sqrt((1 + 1 / k) * pbar * qbar) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2) / k);
    var n1 = num * num / Math.pow(p1 - p2, 2);
    var f = 1 / (1 - (loss || 0));
    var n1f = Math.ceil(n1 * f), n2f = Math.ceil(k * n1 * f);
    return { n1raw: n1, n1: n1f, n2: n2f, total: n1f + n2f };
  };
  Stats.ssTwoMeans = function (sd, delta, alpha, power, k, loss) {
    k = k || 1;
    var za = qnorm(1 - alpha / 2), zb = qnorm(power);
    var n1 = (1 + 1 / k) * sd * sd * Math.pow(za + zb, 2) / (delta * delta);
    var f = 1 / (1 - (loss || 0));
    var n1f = Math.ceil(n1 * f), n2f = Math.ceil(k * n1 * f);
    return { n1raw: n1, n1: n1f, n2: n2f, total: n1f + n2f };
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Stats;
  else root.Stats = Stats;
})(typeof window !== "undefined" ? window : this);
