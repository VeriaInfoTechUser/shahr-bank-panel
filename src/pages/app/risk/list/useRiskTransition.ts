export type RiskState =
  | 'draft'
  | 'registered'
  | 'analysis'
  | 'response'
  | 'monitoring'
  | 'closed'
  | 'archived';

export interface TransitionAction {
  to: RiskState;
  labelKey: string;
  variant: 'primary' | 'danger' | 'warning' | 'outline-secondary';
  needsConfirm: boolean;
}

const TRANSITIONS: Record<RiskState, TransitionAction[]> = {
  draft: [
    { to: 'registered', labelKey: 'risk.action.submit-review', variant: 'primary', needsConfirm: true },
  ],
  registered: [
    { to: 'analysis', labelKey: 'risk.action.start-analysis', variant: 'primary', needsConfirm: true },
    { to: 'archived', labelKey: 'risk.action.archive', variant: 'danger', needsConfirm: true },
  ],
  analysis: [
    { to: 'response', labelKey: 'risk.action.send-response', variant: 'primary', needsConfirm: true },
    { to: 'registered', labelKey: 'risk.action.back-registered', variant: 'outline-secondary', needsConfirm: true },
  ],
  response: [
    { to: 'monitoring', labelKey: 'risk.action.send-monitoring', variant: 'primary', needsConfirm: true },
  ],
  monitoring: [
    { to: 'closed', labelKey: 'risk.action.close-risk', variant: 'primary', needsConfirm: true },
    { to: 'response', labelKey: 'risk.action.back-response', variant: 'outline-secondary', needsConfirm: true },
  ],
  closed: [
    { to: 'archived', labelKey: 'risk.action.archive', variant: 'danger', needsConfirm: true },
    { to: 'monitoring', labelKey: 'risk.action.reopen', variant: 'outline-secondary', needsConfirm: true },
  ],
  archived: [],
};

export interface TransitionRequirements {
  requiredFields: string[];
  requiredSectionFields: Record<string, string[]>;
}

const TRANSITION_REQUIREMENTS: Record<string, TransitionRequirements> = {
  registered: {
    requiredFields: ['title', 'draftDescription', 'riskType', 'categorySlug', 'categoryTitle', 'subCategorySlug', 'subCategoryTitle'],
    requiredSectionFields: { registration: ['title', 'draftDescription', 'riskType', 'categorySlug', 'subCategorySlug'] },
  },
  analysis: {
    requiredFields: ['title', 'draftDescription', 'riskType', 'categorySlug', 'categoryTitle', 'subCategorySlug', 'subCategoryTitle', 'registerDescription'],
    requiredSectionFields: { registration: ['title', 'draftDescription', 'riskType', 'categorySlug', 'subCategorySlug', 'registerDescription'] },
  },
  response: {
    requiredFields: ['impactFactor'],
    requiredSectionFields: { analysis: ['impactFactor'] },
  },
  monitoring: {
    requiredFields: ['strategy'],
    requiredSectionFields: { response: ['strategy'] },
  },
  closed: {
    requiredFields: ['monitoringDescription'],
    requiredSectionFields: { monitoring: ['monitoringDescription'] },
  },
  archived: {
    requiredFields: [],
    requiredSectionFields: {},
  },
};

const ERROR_KEY_MESSAGES: Record<string, string> = {
  'RISK_TRANSITION.REGISTERED.TITLE_REQUIRED': 'risk.error.title-required',
  'RISK_TRANSITION.REGISTERED.DRAFT_DESCRIPTION_REQUIRED': 'risk.error.draft-description-required',
  'RISK_TRANSITION.REGISTERED.RISKTYPE_REQUIRED': 'risk.error.risktype-required',
  'RISK_TRANSITION.REGISTERED.CATEGORYSLUG_REQUIRED': 'risk.error.categoryslug-required',
  'RISK_TRANSITION.REGISTERED.CATEGORYTITLE_REQUIRED': 'risk.error.categorytitle-required',
  'RISK_TRANSITION.REGISTERED.SUBCATEGORYSLUG_REQUIRED': 'risk.error.subcategoryslug-required',
  'RISK_TRANSITION.REGISTERED.SUBCATEGORYTITLE_REQUIRED': 'risk.error.subcategorytitle-required',
  'RISK_TRANSITION.ANALYSIS.REGISTER_DESCRIPTION_REQUIRED': 'risk.error.register-description-required',
  'RISK_TRANSITION.ANALYSIS.IMPACTFACTOR_REQUIRED': 'risk.error.impactfactor-required',
  'RISK_TRANSITION.RESPONSE.STRATEGY_REQUIRED': 'risk.error.strategy-required',
  'RISK_TRANSITION.RESPONSE.CONTROLS_AT_LEAST_ONE_REQUIRED': 'risk.error.controls-required',
  'RISK_TRANSITION.RESPONSE.TASKS_REQUIRED': 'risk.error.tasks-required',
  'RISK_TRANSITION.MONITORING.TASKS_REQUIRED': 'risk.error.tasks-required',
  'RISK_TRANSITION.CLOSED.MONITORING_DESCRIPTION_REQUIRED': 'risk.error.monitoring-description-required',
};

export function useRiskTransition() {
  function getTransitions(status: string): TransitionAction[] {
    return TRANSITIONS[status as RiskState] ?? [];
  }

  function getTransitionRequirements(to: string): TransitionRequirements {
    return TRANSITION_REQUIREMENTS[to] ?? { requiredFields: [], requiredSectionFields: {} };
  }

  function isTransitionDisabled(to: string, formValues: Record<string, unknown>, tasks: { state: string }[]): boolean {
    const req = getTransitionRequirements(to);
    for (const field of req.requiredFields) {
      if (field === 'categoryTitle' || field === 'subCategoryTitle') continue;
      const val = formValues[field];
      if (val == null || String(val).trim() === '') return true;
    }
    if (to === 'monitoring') {
      const control = formValues.control;
      const hasControl = control != null && String(control).trim() !== '';
      const hasTask = tasks.length > 0;
      if (!hasControl || !hasTask) return true;
    }
    return false;
  }

  function parseTransitionErrors(errors: string[]): string[] {
    return errors.map((key) => {
      const mapped = ERROR_KEY_MESSAGES[key];
      if (mapped) return mapped;
      if (key.startsWith('RISK_TRANSITION.INVALID.')) return 'risk.error.invalid-transition';
      return key;
    });
  }

  function getSectionsForStatus(status: string) {
    switch (status as RiskState) {
      case 'draft':
        return { registration: 'editable', analysis: 'hidden', response: 'hidden', monitoring: 'hidden', tasks: 'hidden' };
      case 'registered':
        return { registration: 'editable', analysis: 'hidden', response: 'hidden', monitoring: 'hidden', tasks: 'hidden' };
      case 'analysis':
        return { registration: 'editable', analysis: 'editable', response: 'hidden', monitoring: 'hidden', tasks: 'hidden' };
      case 'response':
        return { registration: 'readonly', analysis: 'readonly', response: 'editable', monitoring: 'hidden', tasks: 'editable' };
      case 'monitoring':
        return { registration: 'readonly', analysis: 'readonly', response: 'readonly', monitoring: 'editable', tasks: 'readonly' };
      case 'closed':
        return { registration: 'readonly', analysis: 'readonly', response: 'readonly', monitoring: 'readonly', tasks: 'readonly' };
      case 'archived':
        return { registration: 'readonly', analysis: 'readonly', response: 'readonly', monitoring: 'readonly', tasks: 'readonly' };
      default:
        return { registration: 'hidden', analysis: 'hidden', response: 'hidden', monitoring: 'hidden', tasks: 'hidden' };
    }
  }

  function calculateRiskLevel(score: number | null): string {
    if (score == null) return '';
    if (score <= 4) return 'low';
    if (score <= 9) return 'medium';
    if (score <= 16) return 'high';
    return 'critical';
  }

  function calculateScore(impact: number | null, likelihood: number | null): number | null {
    if (impact == null || likelihood == null) return null;
    return impact * likelihood;
  }

  return {
    getTransitions,
    getTransitionRequirements,
    isTransitionDisabled,
    parseTransitionErrors,
    getSectionsForStatus,
    calculateRiskLevel,
    calculateScore,
  };
}
