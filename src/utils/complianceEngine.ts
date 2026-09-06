/**
 * Canonical Compliance Engine for LegalMetriX
 * 
 * Single Source of Truth for:
 * - Compliance Status ("COMPLIANT", "NON-COMPLIANT", "REQUIRES REVIEW")
 * - Compliance Score calculation: Math.round((passedChecks / totalChecks) * 100)
 * - Check counts (totalChecks, passedChecks, failedChecks, reviewChecks)
 * - UI visual styling (Green for Compliant, Red for Non-Compliant, Amber for Requires Review)
 * 
 * Strictly follows Legal Metrology statutory rules:
 * 1. NEVER mark a product NON-COMPLIANT when failedChecks === 0.
 * 2. If failedChecks === 0 AND reviewChecks === 0 AND totalChecks > 0: status = "COMPLIANT"
 * 3. If failedChecks > 0: status = "NON-COMPLIANT"
 * 4. If inspection data is missing/uncertain or reviewChecks > 0 with failedChecks === 0: status = "REQUIRES REVIEW"
 * 5. Defensive against null/undefined inputs.
 */

export type CanonicalStatus = 'COMPLIANT' | 'NON-COMPLIANT' | 'REQUIRES REVIEW';
export type NormalizedStatus = 'compliant' | 'non_compliant' | 'needs_review';

export interface CheckItem {
  id?: string;
  fieldKey?: string;
  label?: string;
  status: 'PASS' | 'FAIL' | 'REVIEW' | string;
  detectionState?: string;
  detected?: string;
  required?: string;
  ruleCode?: string;
  severity?: string;
  reason?: string;
  action?: string;
  [key: string]: any;
}

export interface CanonicalCompliance {
  status: CanonicalStatus;
  statusNormalized: NormalizedStatus;
  score: number;
  passedChecks: number;
  failedChecks: number;
  reviewChecks: number;
  totalChecks: number;
  badgeLabel: string;
  heroGradientClass: string;
  badgeBgClass: string;
  textBadgeClass: string;
  summaryText: string;
  isCompliant: boolean;
  isNonCompliant: boolean;
  isNeedsReview: boolean;
}

/**
 * Evaluates compliance canonically from check items, server response, or raw field maps.
 */
export function evaluateCanonicalCompliance(options: {
  checklist?: CheckItem[] | null;
  rulesEvaluated?: any[] | null;
  serverScan?: any | null;
  fields?: Record<string, string> | null;
  ocrConfidence?: number | null;
}): CanonicalCompliance {
  const { checklist, rulesEvaluated, serverScan, fields, ocrConfidence } = options;

  let passed = 0;
  let failed = 0;
  let review = 0;
  let total = 0;

  // 1. If explicit checklist items are provided (e.g. from UI checklist builder)
  if (Array.isArray(checklist) && checklist.length > 0) {
    total = checklist.length;
    for (const item of checklist) {
      const st = String(item.status || '').toUpperCase();
      const ds = String(item.detectionState || '').toUpperCase();

      if (st === 'PASS') {
        passed++;
      } else if (st === 'FAIL' || ds === 'CONFIRMED_MISSING') {
        failed++;
      } else if (st === 'REVIEW') {
        review++;
      } else {
        review++;
      }
    }
  }
  // 2. If rules_evaluated array is available from server / scan
  else if (Array.isArray(rulesEvaluated) && rulesEvaluated.length > 0) {
    total = rulesEvaluated.length;
    for (const rule of rulesEvaluated) {
      const st = String(rule.status || '').toUpperCase();
      const ds = String(rule.detection_state || '').toUpperCase();

      if (st === 'PASS') {
        passed++;
      } else if (st === 'FAIL' || ds === 'CONFIRMED_MISSING') {
        failed++;
      } else if (st === 'REVIEW') {
        review++;
      } else {
        review++;
      }
    }
  }
  // 3. If server scan object with rules_evaluated or violations
  else if (serverScan) {
    const scanRules = serverScan.rules_evaluated || serverScan.extracted_fields?.rules_evaluated;
    if (Array.isArray(scanRules) && scanRules.length > 0) {
      return evaluateCanonicalCompliance({ rulesEvaluated: scanRules, ocrConfidence });
    }

    // Fallback: estimate from mandatory fields if available
    const mandatoryKeys = [
      'mrp',
      'net_quantity',
      'manufacturer_name',
      'manufacturer_address',
      'mfg_date',
      'product_name',
      'consumer_care',
      'country_of_origin'
    ];
    const sourceFields = fields || serverScan.extracted_fields?.semantic_fields || serverScan.extracted_fields || {};
    const violations = serverScan.violations || [];

    total = mandatoryKeys.length;
    const confirmedViolations = violations.filter(
      (v: any) => v.status === 'FAIL' || v.severity === 'HIGH' || v.detection_state === 'CONFIRMED_MISSING'
    );

    for (const key of mandatoryKeys) {
      const val = sourceFields[key];
      const hasVal = val !== undefined && val !== null && String(val).trim().length > 0;
      const isViolated = confirmedViolations.some(
        (v: any) => v.field === key || v.rule_code?.toLowerCase().includes(key)
      );

      if (isViolated) {
        failed++;
      } else if (hasVal) {
        passed++;
      } else {
        review++;
      }
    }
  }
  // 4. Fallback if only fields map is provided
  else if (fields && Object.keys(fields).length > 0) {
    const mandatoryKeys = [
      'mrp',
      'net_quantity',
      'manufacturer_name',
      'manufacturer_address',
      'mfg_date',
      'product_name',
      'consumer_care',
      'country_of_origin'
    ];
    total = mandatoryKeys.length;
    for (const key of mandatoryKeys) {
      const val = fields[key];
      if (val !== undefined && val !== null && String(val).trim().length > 0) {
        passed++;
      } else {
        review++;
      }
    }
  }

  // Calculate canonical score
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;

  // Check for low OCR confidence or insufficient data
  const isConfidenceInsufficient = typeof ocrConfidence === 'number' && ocrConfidence < 40;

  let status: CanonicalStatus;
  let statusNormalized: NormalizedStatus;

  // RULE 1: If there are ANY genuine failed checks -> NON-COMPLIANT
  if (failed > 0) {
    status = 'NON-COMPLIANT';
    statusNormalized = 'non_compliant';
  }
  // RULE 2: If no failed checks, but review items exist OR data is missing/insufficient -> REQUIRES REVIEW
  else if (review > 0 || total === 0 || isConfidenceInsufficient || passed === 0) {
    status = 'REQUIRES REVIEW';
    statusNormalized = 'needs_review';
  }
  // RULE 3: If 0 failed, 0 review, and all checks passed -> COMPLIANT
  else {
    status = 'COMPLIANT';
    statusNormalized = 'compliant';
  }

  // Visual styling mappings
  const isCompliant = status === 'COMPLIANT';
  const isNonCompliant = status === 'NON-COMPLIANT';
  const isNeedsReview = status === 'REQUIRES REVIEW';

  let heroGradientClass = 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-slate-700/50';
  let badgeBgClass = 'bg-slate-600 text-white';
  let textBadgeClass = 'bg-slate-100 text-slate-800 border-slate-200';
  let summaryText = '';

  if (isCompliant) {
    heroGradientClass = 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 border-emerald-600/50';
    badgeBgClass = 'bg-emerald-500 text-white';
    textBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    summaryText = 'All mandatory statutory declarations meet the Legal Metrology (Packaged Commodities) Rules, 2011.';
  } else if (isNeedsReview) {
    heroGradientClass = 'bg-gradient-to-br from-amber-700 via-yellow-900 to-slate-950 border-amber-500/50';
    badgeBgClass = 'bg-amber-500 text-slate-950';
    textBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    summaryText = review > 0
      ? `Packaged commodity contains valid declarations. ${review} declaration(s) require officer verification or multi-panel capture without assuming violation.`
      : 'Packaged commodity data is incomplete or requires officer visual inspection.';
  } else {
    heroGradientClass = 'bg-gradient-to-br from-rose-900 via-red-950 to-slate-950 border-rose-600/50';
    badgeBgClass = 'bg-rose-600 text-white';
    textBadgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    summaryText = `${failed} mandatory Legal Metrology requirement(s) conclusively failed statutory verification.`;
  }

  return {
    status,
    statusNormalized,
    score,
    passedChecks: passed,
    failedChecks: failed,
    reviewChecks: review,
    totalChecks: total,
    badgeLabel: `[${status}]`,
    heroGradientClass,
    badgeBgClass,
    textBadgeClass,
    summaryText,
    isCompliant,
    isNonCompliant,
    isNeedsReview
  };
}

/**
 * Formats a raw status string into standard CanonicalStatus
 */
export function formatCanonicalStatus(rawStatus?: string | null): CanonicalStatus {
  if (!rawStatus) return 'REQUIRES REVIEW';
  const clean = rawStatus.toLowerCase().replace(/[\s-_]+/g, '');
  if (clean === 'compliant') return 'COMPLIANT';
  if (clean === 'noncompliant') return 'NON-COMPLIANT';
  return 'REQUIRES REVIEW';
}

/**
 * Returns consistent UI color classes for any status
 */
export function getStatusBadgeClasses(status: CanonicalStatus | NormalizedStatus | string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const s = String(status).toUpperCase();
  if (s === 'COMPLIANT' || s === 'PASS') {
    return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-500'
    };
  }
  if (s === 'NON-COMPLIANT' || s === 'NON_COMPLIANT' || s === 'FAIL') {
    return {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-300',
      dot: 'bg-rose-500'
    };
  }
  return {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500'
  };
}
