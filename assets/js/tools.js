/* tools.js — evidence-synthesis calculators. Formulas live in stats.js; references are on the page. */
(function () {
  "use strict";
  var S = window.Stats;
  var $ = function (id) { return document.getElementById(id); };
  var lang = function () { return document.documentElement.getAttribute("lang") === "es" ? "es" : "en"; };
  var L = function (en, es) { return lang() === "es" ? es : en; };

  // ---------- formatting ----------
  function num(id) {
    var el = $(id); if (!el) return NaN;
    var v = String(el.value).trim().replace(",", ".");
    return v === "" ? NaN : Number(v);
  }
  function has(x) { return typeof x === "number" && isFinite(x); }
  function f(x, dp) {
    if (!has(x)) return x === Infinity ? "∞" : "–";
    dp = dp === undefined ? 2 : dp;
    return x.toFixed(dp);
  }
  function pct(x, dp) { return has(x) ? (x * 100).toFixed(dp === undefined ? 1 : dp) + "%" : "–"; }
  function ci(a, dp, isPct) {
    var g = isPct ? function (v) { return pct(v, dp); } : function (v) { return f(v, dp); };
    return g(a[0]) + " " + L("to", "a") + " " + g(a[1]);
  }
  function pval(p) { if (!has(p)) return "–"; return p < 0.001 ? "< 0.001" : p.toFixed(3); }
  function empty(en, es) { return '<p class="result-empty">' + L(en, es) + "</p>"; }
  function err(en, es) { return '<p class="result-error" role="alert">' + L(en, es) + "</p>"; }
  function mains(items) {
    return '<div class="result-main">' + items.map(function (it) {
      return "<div><span>" + it[0] + '</span><strong class="' + (it[2] || "") + '">' + it[1] + "</strong></div>";
    }).join("") + "</div>";
  }
  function table(head, rows) {
    return '<div class="res-wrap"><table class="res"><thead><tr>' + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>";
  }
  function note(en, es) { return '<p class="note">' + L(en, es) + "</p>"; }

  // ---------- calculators ----------
  var tools = {};

  tools.median = function () {
    var o = { n: num("m-n"), min: num("m-min"), q1: num("m-q1"), median: num("m-med"), q3: num("m-q3"), max: num("m-max") };
    if (!has(o.n) && !has(o.median)) return empty("Enter the sample size, the median, and either the IQR, the range, or both.",
      "Ingresa el tamaño muestral, la mediana y el RIC, el rango, o ambos.");
    var r = S.medianToMean(o);
    if (r.error === "needN") return err("Sample size (n ≥ 3) and median are required.", "Se requieren el tamaño muestral (n ≥ 3) y la mediana.");
    if (r.error === "needSpread") return err("Add Q1 and Q3, or the minimum and maximum.", "Agrega Q1 y Q3, o el mínimo y el máximo.");
    if (r.error === "order") return err("Values must be in order: min ≤ Q1 ≤ median ≤ Q3 ≤ max.", "Los valores deben estar ordenados: mín ≤ Q1 ≤ mediana ≤ Q3 ≤ máx.");
    var sc = { S1: L("S1: median + range", "S1: mediana + rango"), S2: L("S2: median + IQR", "S2: mediana + RIC"), S3: L("S3: median + IQR + range", "S3: mediana + RIC + rango") }[r.scenario];
    var out = mains([[L("Estimated mean", "Media estimada"), f(r.mean, 2), "accent"], [L("Estimated SD", "DE estimada"), f(r.sd, 2)]]);
    out += table([L("Item", "Elemento"), L("Value", "Valor")], [
      [L("Scenario used", "Escenario usado"), sc],
      [L("Mean method", "Método de la media"), "Luo et al. (2018)"],
      [L("SD method", "Método de la DE"), "Wan et al. (2014)"],
      ["ξ(n) " + L("range divisor", "divisor del rango"), f(r.xi, 4)],
      ["η(n) " + L("IQR divisor", "divisor del RIC"), f(r.eta, 4)]
    ]);
    if (Math.abs(r.skew) > 0.3) out += note("The quartiles or range look asymmetric (skewness index " + f(r.skew, 2) + "). These methods assume roughly normal data; for skewed data consider the QE or BC methods (R package estmeansd) or a sensitivity analysis without this study.",
      "Los cuartiles o el rango parecen asimétricos (índice de asimetría " + f(r.skew, 2) + "). Estos métodos asumen datos aproximadamente normales; con datos asimétricos considera los métodos QE o BC (paquete de R estmeansd) o un análisis de sensibilidad sin este estudio.");
    return out;
  };

  tools.combine = function () {
    var rows = Array.prototype.slice.call(document.querySelectorAll("#combine-rows tr"));
    var groups = rows.map(function (tr) {
      var g = function (c) { var v = tr.querySelector("." + c).value.trim().replace(",", "."); return v === "" ? NaN : +v; };
      return { n: g("g-n"), mean: g("g-mean"), sd: g("g-sd") };
    });
    var filled = groups.filter(function (x) { return has(x.n) && has(x.mean) && has(x.sd); });
    if (filled.length < 2) return empty("Fill n, mean and SD for at least two groups.", "Completa n, media y DE de al menos dos grupos.");
    if (filled.some(function (x) { return x.n < 1 || x.sd < 0; })) return err("n must be ≥ 1 and SD cannot be negative.", "n debe ser ≥ 1 y la DE no puede ser negativa.");
    var r = S.combineGroups(filled);
    return mains([[L("Combined n", "n combinado"), String(r.n)], [L("Combined mean", "Media combinada"), f(r.mean, 3), "accent"], [L("Combined SD", "DE combinada"), f(r.sd, 3)]]) +
      note("Combined " + filled.length + " groups with the Cochrane Handbook formula (Table 6.5.a), applied one pair at a time.",
        "Se combinaron " + filled.length + " grupos con la fórmula del Manual Cochrane (Tabla 6.5.a), aplicada de a pares.");
  };

  tools.sdfinder = function () {
    var mode = document.querySelector('#tool-sdfinder .seg [aria-pressed="true"]').getAttribute("data-mode");
    var r, rows;
    if (mode === "se") {
      var se = num("sd-se-se"), n = num("sd-se-n");
      if (!has(se) || !has(n)) return empty("Enter the standard error and the group size.", "Ingresa el error estándar y el tamaño del grupo.");
      if (se < 0 || n < 1) return err("SE must be ≥ 0 and n ≥ 1.", "El EE debe ser ≥ 0 y n ≥ 1.");
      return mains([[L("SD", "DE"), f(S.sdFromSE(se, n), 3), "accent"]]) + note("SD = SE × √n", "DE = EE × √n");
    }
    if (mode === "ci") {
      var lo = num("sd-ci-lo"), hi = num("sd-ci-hi"), n2 = num("sd-ci-n"), lv = +$("sd-ci-level").value;
      if (!has(lo) || !has(hi) || !has(n2)) return empty("Enter the lower and upper limits of the CI and the group size.", "Ingresa los límites inferior y superior del IC y el tamaño del grupo.");
      if (hi <= lo || n2 < 2) return err("The upper limit must exceed the lower limit, and n must be ≥ 2.", "El límite superior debe ser mayor que el inferior y n debe ser ≥ 2.");
      r = S.sdFromCI(lo, hi, n2, lv);
      rows = [[L("t quantile", "Cuantil t") + " (df = " + (n2 - 1) + ")", f(r.q, 4)], [L("Standard error", "Error estándar"), f(r.se, 4)], [L("Implied mean (midpoint)", "Media implícita (punto medio)"), f((lo + hi) / 2, 3)]];
      return mains([[L("SD", "DE"), f(r.sd, 3), "accent"]]) + table([L("Item", "Elemento"), L("Value", "Valor")], rows) +
        note("Uses the t distribution with n − 1 df, as the Cochrane Handbook advises for small samples; for large n it converges to 3.92 for a 95% CI.",
          "Usa la distribución t con n − 1 gl, como recomienda el Manual Cochrane para muestras pequeñas; con n grande converge a 3,92 para un IC del 95%.");
    }
    if (mode === "mdci") {
      var l2 = num("sd-md-lo"), h2 = num("sd-md-hi"), a1 = num("sd-md-n1"), a2 = num("sd-md-n2"), lv2 = +$("sd-md-level").value;
      if (![l2, h2, a1, a2].every(has)) return empty("Enter the CI of the mean difference and both group sizes.", "Ingresa el IC de la diferencia de medias y el tamaño de ambos grupos.");
      if (h2 <= l2 || a1 < 2 || a2 < 2) return err("The upper limit must exceed the lower limit, and each n must be ≥ 2.", "El límite superior debe ser mayor que el inferior y cada n debe ser ≥ 2.");
      r = S.sdFromMDCI(l2, h2, a1, a2, lv2);
      return mains([[L("SD (each group)", "DE (cada grupo)"), f(r.sd, 3), "accent"]]) +
        table([L("Item", "Elemento"), L("Value", "Valor")], [[L("t quantile", "Cuantil t") + " (df = " + (a1 + a2 - 2) + ")", f(r.q, 4)], [L("SE of the difference", "EE de la diferencia"), f(r.se, 4)]]) +
        note("Assumes the same SD in both groups (the usual imputation in the Cochrane Handbook, section 6.5.2.3).", "Asume la misma DE en ambos grupos (la imputación habitual del Manual Cochrane, sección 6.5.2.3).");
    }
    // p or t
    var md = num("sd-pt-md"), b1 = num("sd-pt-n1"), b2 = num("sd-pt-n2"), kind = $("sd-pt-kind").value, v = num("sd-pt-val");
    if (![md, b1, b2, v].every(has)) return empty("Enter the mean difference, both group sizes and the p-value or t statistic.", "Ingresa la diferencia de medias, el tamaño de ambos grupos y el valor p o el estadístico t.");
    if (b1 < 2 || b2 < 2 || md === 0) return err("Each n must be ≥ 2 and the mean difference cannot be 0.", "Cada n debe ser ≥ 2 y la diferencia de medias no puede ser 0.");
    if (kind === "p" && !(v > 0 && v < 1)) return err("The p-value must be between 0 and 1 (use the exact value, not \"< 0.05\").", "El valor p debe estar entre 0 y 1 (usa el valor exacto, no \"< 0,05\").");
    r = kind === "p" ? S.sdFromP(v, md, b1, b2) : S.sdFromT(v, md, b1, b2);
    return mains([[L("SD (each group)", "DE (cada grupo)"), f(r.sd, 3), "accent"]]) +
      table([L("Item", "Elemento"), L("Value", "Valor")], [["|t|" + (kind === "p" ? " " + L("(from p, df = ", "(desde p, gl = ") + (b1 + b2 - 2) + ")" : ""), f(r.t, 4)], [L("SE of the difference", "EE de la diferencia"), f(r.se, 4)]]) +
      note("Assumes a two-sided, two-sample t-test with a pooled SD.", "Asume una prueba t de dos muestras, bilateral, con DE combinada.");
  };

  tools.diagnostic = function () {
    var tp = num("dx-tp"), fp = num("dx-fp"), fn = num("dx-fn"), tn = num("dx-tn"), pre = num("dx-pre");
    if (![tp, fp, fn, tn].every(has)) return empty("Fill the four cells of the 2×2 table.", "Completa las cuatro celdas de la tabla 2×2.");
    if ([tp, fp, fn, tn].some(function (x) { return x < 0 || x % 1 !== 0; })) return err("Cells must be whole numbers ≥ 0.", "Las celdas deben ser números enteros ≥ 0.");
    var r = S.diagnostic(tp, fp, fn, tn, has(pre) ? pre / 100 : undefined);
    if (r.error) return err("The table is empty.", "La tabla está vacía.");
    var out = mains([[L("Sensitivity", "Sensibilidad"), pct(r.sens.est), "accent"], [L("Specificity", "Especificidad"), pct(r.spec.est), "accent"], ["LR+", f(r.lrp.est, 2)], ["LR−", f(r.lrn.est, 2)]]);
    out += table([L("Measure", "Medida"), L("Estimate", "Estimación"), L("95% CI", "IC 95%")], [
      [L("Sensitivity", "Sensibilidad"), pct(r.sens.est), ci(r.sens.ci, 1, true)],
      [L("Specificity", "Especificidad"), pct(r.spec.est), ci(r.spec.ci, 1, true)],
      [L("Positive predictive value", "Valor predictivo positivo"), pct(r.ppv.est), ci(r.ppv.ci, 1, true)],
      [L("Negative predictive value", "Valor predictivo negativo"), pct(r.npv.est), ci(r.npv.ci, 1, true)],
      [L("Positive likelihood ratio", "Razón de verosimilitud positiva"), f(r.lrp.est), ci(r.lrp.ci)],
      [L("Negative likelihood ratio", "Razón de verosimilitud negativa"), f(r.lrn.est), ci(r.lrn.ci)],
      [L("Diagnostic odds ratio", "Odds ratio diagnóstica"), f(r.dor.est, 1), ci(r.dor.ci, 1)],
      [L("Accuracy", "Exactitud"), pct(r.acc.est), ci(r.acc.ci, 1, true)],
      [L("Prevalence in sample", "Prevalencia en la muestra"), pct(r.prev.est), ci(r.prev.ci, 1, true)],
      [L("Youden index", "Índice de Youden"), f(r.youden, 3), ""]
    ]);
    out += table([L("Pre-test probability", "Probabilidad preprueba"), L("After a positive test", "Tras prueba positiva"), L("After a negative test", "Tras prueba negativa")],
      [[pct(r.pretest) + (has(pre) ? "" : L(" (sample prevalence)", " (prevalencia muestral)")), pct(r.postPos), pct(r.postNeg)]]);
    if (r.corrected) out += note("A cell is zero, so 0.5 was added to every cell for the likelihood ratios and DOR.", "Hay una celda en cero, así que se sumó 0,5 a todas las celdas para las razones de verosimilitud y la DOR.");
    return out;
  };

  tools.binary = function () {
    var e1 = num("bin-e1"), n1 = num("bin-n1"), e2 = num("bin-e2"), n2 = num("bin-n2");
    if (![e1, n1, e2, n2].every(has)) return empty("Enter events and totals for both groups.", "Ingresa eventos y totales de ambos grupos.");
    var r = S.binaryEffects(e1, n1, e2, n2);
    if (r.error) return err("Events must be between 0 and the group total, and totals must be > 0.", "Los eventos deben estar entre 0 y el total del grupo, y los totales deben ser > 0.");
    var nntLbl = r.rd.est < 0 ? L("NNT (benefit)", "NNT (beneficio)") : r.rd.est > 0 ? L("NNH (harm)", "NNH (daño)") : "NNT";
    var out = mains([["RR", f(r.rr.est), "accent"], ["OR", f(r.or.est)], [L("Risk difference", "Diferencia de riesgos"), pct(r.rd.est)], [nntLbl, has(r.nnt) ? Math.ceil(r.nnt) : "∞"]]);
    out += table([L("Measure", "Medida"), L("Estimate", "Estimación"), L("95% CI", "IC 95%"), "p"], [
      [L("Risk, intervention", "Riesgo, intervención"), pct(r.p1), "", ""],
      [L("Risk, control", "Riesgo, control"), pct(r.p2), "", ""],
      [L("Risk ratio (RR)", "Razón de riesgos (RR)"), f(r.rr.est), ci(r.rr.ci), pval(r.rr.p)],
      [L("Odds ratio (OR)", "Odds ratio (OR)"), f(r.or.est), ci(r.or.ci), pval(r.or.p)],
      [L("Risk difference (RD)", "Diferencia de riesgos (DR)"), pct(r.rd.est), ci(r.rd.ci, 1, true), pval(r.rd.p)],
      [L("Relative risk reduction", "Reducción relativa del riesgo"), pct(r.rrr), "", ""],
      [nntLbl, has(r.nnt) ? f(r.nnt, 1) : "∞", r.nntCI ? ci(r.nntCI, 1) : L("CI includes no effect", "El IC incluye el no efecto"), ""]
    ]);
    if (r.corrected) out += note("A cell is zero, so 0.5 was added to every cell for RR and OR.", "Hay una celda en cero, así que se sumó 0,5 a todas las celdas para RR y OR.");
    return out;
  };

  tools.smd = function () {
    var v = ["smd-m1", "smd-s1", "smd-n1", "smd-m2", "smd-s2", "smd-n2"].map(num);
    var out = "";
    if (!v.every(has)) out = empty("Enter mean, SD and n for both groups.", "Ingresa media, DE y n de ambos grupos.");
    else {
      var r = S.smd(v[0], v[1], v[2], v[3], v[4], v[5]);
      if (r.error) out = err("Each n must be ≥ 2 and each SD > 0.", "Cada n debe ser ≥ 2 y cada DE > 0.");
      else {
        out = mains([["Hedges' g", f(r.g, 3), "accent"], [L("95% CI", "IC 95%"), ci(r.ciG, 2)], [L("Mean difference", "Diferencia de medias"), f(r.md, 2)]]);
        out += table([L("Measure", "Medida"), L("Estimate", "Estimación"), "SE", L("95% CI", "IC 95%")], [
          [L("Mean difference (MD)", "Diferencia de medias (DM)"), f(r.md, 3), f(r.seMD, 3), ci(r.ciMD, 2)],
          ["Cohen's d", f(r.d, 3), f(r.seD, 3), ""],
          ["Hedges' g", f(r.g, 3), f(r.seG, 3), ci(r.ciG, 3)],
          [L("Pooled SD", "DE combinada"), f(r.sp, 3), "", ""],
          [L("Correction factor J", "Factor de corrección J"), f(r.J, 4), "", ""],
          [L("Equivalent OR (Chinn)", "OR equivalente (Chinn)"), f(r.orFromG, 2), "", ""]
        ]);
      }
    }
    $("smd-result").innerHTML = out;
    var o = num("conv-or"), d = num("conv-d"), c = "";
    if (has(o) && o > 0) c += "<div><span>OR " + f(o, 2) + " → SMD</span><strong>" + f(S.orToSmd(o), 3) + "</strong></div>";
    if (has(d)) c += "<div><span>SMD " + f(d, 2) + " → OR</span><strong>" + f(S.smdToOr(d), 3) + "</strong></div>";
    $("conv-result").innerHTML = c ? '<div class="result-main">' + c + "</div>" : empty("Enter an OR or an SMD to convert.", "Ingresa un OR o una DME para convertir.");
    return null;
  };

  tools.kappa = function () {
    var a = num("k-a"), b = num("k-b"), c = num("k-c"), d = num("k-d");
    if (![a, b, c, d].every(has)) return empty("Fill the four cells with the screening decisions of both reviewers.", "Completa las cuatro celdas con las decisiones de cribado de ambos revisores.");
    if ([a, b, c, d].some(function (x) { return x < 0 || x % 1 !== 0; })) return err("Cells must be whole numbers ≥ 0.", "Las celdas deben ser números enteros ≥ 0.");
    var r = S.kappa(a, b, c, d);
    if (r.error) return err("The table is empty.", "La tabla está vacía.");
    var k = r.kappa, band;
    if (k < 0) band = L("poor (below chance)", "pobre (menor al azar)");
    else if (k <= 0.2) band = L("slight", "leve");
    else if (k <= 0.4) band = L("fair", "aceptable");
    else if (k <= 0.6) band = L("moderate", "moderada");
    else if (k <= 0.8) band = L("substantial", "considerable");
    else band = L("almost perfect", "casi perfecta");
    return mains([["Cohen's κ", f(k, 3), "accent"], [L("95% CI", "IC 95%"), ci(r.ci, 2)], [L("Agreement", "Concordancia"), band]]) +
      table([L("Measure", "Medida"), L("Value", "Valor")], [
        [L("Records screened", "Registros cribados"), String(r.n)],
        [L("Observed agreement", "Concordancia observada"), pct(r.po)],
        [L("Agreement expected by chance", "Concordancia esperada por azar"), pct(r.pe)],
        ["PABAK", f(r.pabak, 3)],
        [L("Disagreements to resolve", "Discrepancias a resolver"), String(b + c)]
      ]) + note("Bands follow Landis & Koch (1977). With very few includes, κ can be low despite high raw agreement; PABAK helps show that.",
        "Las categorías siguen a Landis y Koch (1977). Con muy pocos incluidos, κ puede ser bajo pese a una alta concordancia bruta; el PABAK ayuda a mostrarlo.");
  };

  tools.samplesize = function () {
    var mode = document.querySelector('#tool-samplesize .seg [aria-pressed="true"]').getAttribute("data-mode");
    var r;
    if (mode === "prop") {
      var p = num("ss-p"), d = num("ss-d"), conf = +$("ss-conf").value, N = num("ss-N"), deff = num("ss-deff"), loss = num("ss-loss");
      if (!has(p) || !has(d)) return empty("Enter the expected proportion and the precision (margin of error).", "Ingresa la proporción esperada y la precisión (margen de error).");
      if (!(p > 0 && p < 100) || !(d > 0 && d < 100)) return err("Proportion and precision must be between 0 and 100%.", "La proporción y la precisión deben estar entre 0 y 100%.");
      if (has(loss) && (loss < 0 || loss >= 100)) return err("Expected losses must be between 0 and 99%.", "Las pérdidas esperadas deben estar entre 0 y 99%.");
      r = S.ssProportion(p / 100, d / 100, conf, has(N) ? N : 0, has(deff) && deff > 0 ? deff : 1, has(loss) ? loss / 100 : 0);
      return mains([[L("Participants to recruit", "Participantes a reclutar"), String(r.final), "accent"]]) +
        table([L("Step", "Paso"), L("Value", "Valor")], [
          ["z", f(r.z, 3)],
          [L("Base size, infinite population", "Tamaño base, población infinita"), f(r.n0, 1)],
          [L("After finite-population correction and design effect", "Tras corrección por población finita y efecto de diseño"), f(r.n, 1)],
          [L("After adjusting for expected losses", "Tras ajustar por pérdidas esperadas"), String(r.final)]
        ]);
    }
    var alpha, power, k, lossf, res;
    if (mode === "twoprop") {
      var p1 = num("ss2-p1"), p2 = num("ss2-p2");
      alpha = +$("ss2-alpha").value; power = +$("ss2-power").value; k = num("ss2-k"); lossf = num("ss2-loss");
      if (!has(p1) || !has(p2)) return empty("Enter the expected proportion in each group.", "Ingresa la proporción esperada en cada grupo.");
      if (!(p1 > 0 && p1 < 100 && p2 > 0 && p2 < 100) || p1 === p2) return err("Proportions must be between 0 and 100% and different from each other.", "Las proporciones deben estar entre 0 y 100% y ser distintas entre sí.");
      res = S.ssTwoProportions(p1 / 100, p2 / 100, alpha, power, has(k) && k > 0 ? k : 1, has(lossf) ? lossf / 100 : 0);
    } else {
      var sd = num("ssm-sd"), delta = num("ssm-delta");
      alpha = +$("ssm-alpha").value; power = +$("ssm-power").value; k = num("ssm-k"); lossf = num("ssm-loss");
      if (!has(sd) || !has(delta)) return empty("Enter the expected SD and the smallest difference worth detecting.", "Ingresa la DE esperada y la diferencia mínima relevante a detectar.");
      if (sd <= 0 || delta === 0) return err("SD must be > 0 and the difference cannot be 0.", "La DE debe ser > 0 y la diferencia no puede ser 0.");
      res = S.ssTwoMeans(sd, Math.abs(delta), alpha, power, has(k) && k > 0 ? k : 1, has(lossf) ? lossf / 100 : 0);
    }
    return mains([[L("Total to recruit", "Total a reclutar"), String(res.total), "accent"], [L("Group 1", "Grupo 1"), String(res.n1)], [L("Group 2", "Grupo 2"), String(res.n2)]]) +
      note("Two-sided test, α = " + alpha + ", power = " + Math.round(power * 100) + "%. Before losses: " + f(res.n1raw, 1) + " in group 1.",
        "Prueba bilateral, α = " + alpha + ", potencia = " + Math.round(power * 100) + "%. Antes de pérdidas: " + f(res.n1raw, 1) + " en el grupo 1.");
  };

  // ---------- examples ----------
  var EX = {
    median: { "m-n": 64, "m-min": 18, "m-q1": 31, "m-med": 42, "m-q3": 55, "m-max": 79 },
    combine: [[40, 12.3, 3.1], [35, 14.1, 3.6], [28, 11.8, 2.9]],
    sdfinder: { "sd-se-se": 0.8, "sd-se-n": 45, "sd-ci-lo": 118.2, "sd-ci-hi": 126.4, "sd-ci-n": 38, "sd-md-lo": -6.1, "sd-md-hi": -0.9, "sd-md-n1": 52, "sd-md-n2": 50, "sd-pt-md": 3.2, "sd-pt-n1": 30, "sd-pt-n2": 31, "sd-pt-val": 0.021 },
    diagnostic: { "dx-tp": 88, "dx-fp": 21, "dx-fn": 12, "dx-tn": 179, "dx-pre": "" },
    binary: { "bin-e1": 24, "bin-n1": 210, "bin-e2": 41, "bin-n2": 205 },
    smd: { "smd-m1": 21.4, "smd-s1": 5.2, "smd-n1": 48, "smd-m2": 24.9, "smd-s2": 6.1, "smd-n2": 50, "conv-or": 2.5, "conv-d": "" },
    kappa: { "k-a": 42, "k-b": 9, "k-c": 6, "k-d": 843 },
    samplesize: { "ss-p": 30, "ss-d": 5, "ss-N": "", "ss-deff": 1, "ss-loss": 10, "ss2-p1": 30, "ss2-p2": 15, "ss2-k": 1, "ss2-loss": 10, "ssm-sd": 12, "ssm-delta": 5, "ssm-k": 1, "ssm-loss": 10 }
  };
  function loadExample(name) {
    var ex = EX[name]; if (!ex) return;
    if (name === "combine") {
      var body = $("combine-rows"); body.innerHTML = "";
      ex.forEach(function (r) { addGroupRow(r); });
    } else Object.keys(ex).forEach(function (id) { if ($(id)) $(id).value = ex[id]; });
    run(name);
  }
  function clearTool(name) {
    var sec = $("tool-" + name);
    sec.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    if (name === "combine") { $("combine-rows").innerHTML = ""; addGroupRow(); addGroupRow(); }
    run(name);
  }

  // ---------- combine rows ----------
  function addGroupRow(vals) {
    var body = $("combine-rows");
    var i = body.children.length + 1;
    var tr = document.createElement("tr");
    var v = vals || ["", "", ""];
    tr.innerHTML = "<td>" + i + "</td>" +
      '<td><input type="number" inputmode="decimal" class="g-n" min="1" step="1" aria-label="n" value="' + v[0] + '"></td>' +
      '<td><input type="number" inputmode="decimal" class="g-mean" step="any" aria-label="mean" value="' + v[1] + '"></td>' +
      '<td><input type="number" inputmode="decimal" class="g-sd" min="0" step="any" aria-label="SD" value="' + v[2] + '"></td>' +
      '<td><button type="button" class="rm" aria-label="Remove">×</button></td>';
    body.appendChild(tr);
  }
  function renumber() { Array.prototype.forEach.call($("combine-rows").children, function (tr, i) { tr.firstChild.textContent = i + 1; }); }

  // ---------- engine ----------
  function run(name) {
    var box = $("result-" + name);
    var html = tools[name]();
    if (box && html !== null) box.innerHTML = html;
  }
  function runAll() { Object.keys(tools).forEach(run); }

  function show(name) {
    if (!$("tool-" + name)) name = "median";
    document.querySelectorAll(".tool").forEach(function (t) { t.classList.toggle("active", t.id === "tool-" + name); });
    document.querySelectorAll(".tool-index a").forEach(function (a) {
      if (a.getAttribute("href") === "#" + name) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    var sel = $("tool-select"); if (sel) sel.value = name;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!S || !$("tool-median")) return;
    addGroupRow(); addGroupRow();

    Object.keys(tools).forEach(function (name) {
      var sec = $("tool-" + name);
      sec.addEventListener("input", function () { run(name); });
      sec.addEventListener("change", function () { run(name); });
      var ex = sec.querySelector("[data-example]"); if (ex) ex.addEventListener("click", function () { loadExample(name); });
      var cl = sec.querySelector("[data-clear]"); if (cl) cl.addEventListener("click", function () { clearTool(name); });
      var cp = sec.querySelector("[data-copy]");
      if (cp) cp.addEventListener("click", function () {
        var boxes = sec.querySelectorAll(".result");
        var txt = Array.prototype.map.call(boxes, function (b) { return b.innerText; }).join("\n\n").trim();
        window.UI.copy(sec.querySelector("h2").innerText + "\n\n" + txt + "\n\n" + location.href);
      });
      sec.querySelectorAll(".seg button").forEach(function (b) {
        b.addEventListener("click", function () {
          sec.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          sec.querySelectorAll(".subform").forEach(function (s) { s.classList.toggle("active", s.getAttribute("data-mode") === b.getAttribute("data-mode")); });
          run(name);
        });
      });
    });

    $("add-group").addEventListener("click", function () { addGroupRow(); });
    $("combine-rows").addEventListener("click", function (e) {
      if (!e.target.classList.contains("rm")) return;
      if ($("combine-rows").children.length <= 2) { e.target.closest("tr").querySelectorAll("input").forEach(function (i) { i.value = ""; }); }
      else e.target.closest("tr").remove();
      renumber(); run("combine");
    });

    var sel = $("tool-select");
    if (sel) sel.addEventListener("change", function () { location.hash = sel.value; });
    window.addEventListener("hashchange", function () { show(location.hash.slice(1)); });
    show(location.hash.slice(1) || "median");
    runAll();
    function localiseSelect() {
      if (!sel) return;
      sel.querySelectorAll("[data-en]").forEach(function (o) {
        var v = o.getAttribute("data-" + lang());
        if (o.tagName === "OPTGROUP") o.label = v; else o.textContent = v;
      });
    }
    localiseSelect();
    document.addEventListener("langchange", function () { runAll(); localiseSelect(); });
  });
})();
