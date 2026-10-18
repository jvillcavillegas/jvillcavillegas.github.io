# =============================================================================
#  Diagnostic test accuracy meta-analysis template (R, package 'mada')
#  Jose Luis Villca Villegas | ORCID 0000-0002-0357-5489
#  Licence: MIT. Replace the example data with your own 2x2 tables.
#
#  Plantilla de metaanálisis de precisión diagnóstica (modelo bivariado).
# =============================================================================

if (!requireNamespace("mada", quietly = TRUE)) install.packages("mada")
library(mada)

# ---- 1. Data: one row per study, 2x2 counts against the reference standard ----
# Example data (fictitious, for illustration only)
dat <- data.frame(
  names = c("Study A", "Study B", "Study C", "Study D", "Study E", "Study F", "Study G"),
  TP = c(45, 30, 88, 20, 61, 37, 52),
  FN = c(5,  8,  12, 4,  9,  6,  11),
  FP = c(12, 6,  21, 9,  15, 10, 8),
  TN = c(138, 96, 179, 67, 215, 147, 129)
)

# ---- 2. Descriptive statistics per study (with Wilson-type CIs) ---------------
desc <- madad(dat)
desc

png("forest_sensitivity.png", width = 1800, height = 1200, res = 220)
forest(desc, type = "sens", main = "Sensitivity")
dev.off()
png("forest_specificity.png", width = 1800, height = 1200, res = 220)
forest(desc, type = "spec", main = "Specificity")
dev.off()

# ---- 3. Bivariate random-effects model (Reitsma et al. 2005) -------------------
fit <- reitsma(dat)
summary(fit)   # pooled sensitivity & false-positive rate, AUC, correlation

# Pooled sensitivity and specificity on the natural scale
b   <- coef(fit)
sens <- plogis(b[1]); spec <- 1 - plogis(b[2])
cat(sprintf("\nPooled sensitivity: %.3f\nPooled specificity: %.3f\n", sens, spec))

# ---- 4. SROC curve with confidence region --------------------------------------
png("sroc.png", width = 1600, height = 1600, res = 250)
plot(fit, sroclwd = 2, main = "Summary ROC (bivariate model)")
points(fpr(dat), sens(dat), pch = 2)
legend("bottomright", c("Studies", "Summary estimate"), pch = c(2, 1))
dev.off()

# ---- 5. Next steps ---------------------------------------------------------------
# - Assess risk of bias with QUADAS-2 (see the 'robvis' package for figures).
# - Explore heterogeneity with covariates: reitsma(dat, formula = cbind(tsens, tfpr) ~ covariate)
# - Rate certainty with GRADE for diagnostic tests.
