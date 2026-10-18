# =============================================================================
#  Pairwise meta-analysis template (R, package 'meta' >= 7.0)
#  Jose Luis Villca Villegas | ORCID 0000-0002-0357-5489
#  Licence: MIT. Replace the example data with your own extraction.
#
#  Plantilla de metaanálisis por pares. Reemplaza los datos de ejemplo
#  con tu propia extracción y ejecuta el script de principio a fin.
# =============================================================================

# ---- 0. Packages -------------------------------------------------------------
pkgs <- c("meta")
new  <- pkgs[!pkgs %in% rownames(installed.packages())]
if (length(new)) install.packages(new)
library(meta)
settings.meta("RevMan5")   # Cochrane-style printing; remove for package defaults

# ---- 1. Data -----------------------------------------------------------------
# Option A: read your extraction sheet (same columns as extraction_template.csv)
# dat <- read.csv("extraction_template.csv")

# Option B: example data (fictitious, for illustration only)
dat <- data.frame(
  study   = c("Study A 2016", "Study B 2018", "Study C 2019",
              "Study D 2021", "Study E 2022", "Study F 2024"),
  event.e = c(12, 8, 30, 5, 22, 14),
  n.e     = c(150, 90, 410, 60, 300, 180),
  event.c = c(20, 11, 41, 9, 35, 16),
  n.c     = c(148, 92, 405, 61, 298, 175),
  mean.e  = c(21.4, 19.8, 23.1, 20.5, 22.0, 18.9),
  sd.e    = c(5.2, 6.0, 5.8, 4.9, 6.3, 5.5),
  mean.c  = c(24.9, 21.0, 25.2, 23.8, 23.1, 21.7),
  sd.c    = c(6.1, 5.7, 6.2, 5.3, 6.0, 5.9),
  rob     = c("Low", "Some concerns", "Low", "High", "Low", "Some concerns")
)

# ---- 2. Binary outcome: risk ratio, random effects ------------------------------
m_bin <- metabin(
  event.e, n.e, event.c, n.c,
  studlab          = study,
  data             = dat,
  sm               = "RR",
  method           = "MH",       # Mantel-Haenszel for the common-effect model
  method.tau       = "REML",     # between-study variance (tau^2)
  method.random.ci = "HK",       # Hartung-Knapp adjustment
  prediction       = TRUE,
  common           = FALSE,
  random           = TRUE
)
summary(m_bin)

png("forest_binary.png", width = 2400, height = 1300, res = 250)
forest(m_bin, sortvar = TE, label.e = "Intervention", label.c = "Control")
dev.off()

# ---- 3. Continuous outcome: SMD (Hedges' g) -----------------------------------
m_cont <- metacont(
  n.e, mean.e, sd.e, n.c, mean.c, sd.c,
  studlab          = study,
  data             = dat,
  sm               = "SMD",      # Hedges' g by default
  method.tau       = "REML",
  method.random.ci = "HK",
  prediction       = TRUE,
  common           = FALSE
)
summary(m_cont)

png("forest_continuous.png", width = 2400, height = 1300, res = 250)
forest(m_cont, sortvar = TE)
dev.off()

# ---- 4. Heterogeneity and sensitivity ------------------------------------------
# I^2, tau^2 and the prediction interval are printed by summary().
metainf(m_bin, pooled = "random")             # leave-one-out
update(m_bin, subset = rob != "High")         # exclude high risk of bias
update(m_bin, subgroup = rob)                 # subgroup by risk of bias

# ---- 5. Small-study effects ------------------------------------------------------
png("funnel_binary.png", width = 1600, height = 1400, res = 250)
funnel(m_bin, studlab = TRUE)
dev.off()
# Egger's test needs at least 10 studies to be meaningful:
if (m_bin$k >= 10) metabias(m_bin, method.bias = "Egger")

# ---- 6. Report -----------------------------------------------------------------
cat("\nReport: random-effects (REML, Hartung-Knapp) pooled estimate, 95% CI,",
    "95% prediction interval, I^2 and tau^2; grade certainty with GRADE.\n")
