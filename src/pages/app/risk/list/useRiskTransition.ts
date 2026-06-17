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
    { to: 'analysis', labelKey: 'risk.action.back-analysis', variant: 'outline-secondary', needsConfirm: true },
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

export function useRiskTransition() {
  function getTransitions(status: string): TransitionAction[] {
    return TRANSITIONS[status as RiskState] ?? [];
  }

  function getSectionsForStatus(status: string) {
    switch (status as RiskState) {
      case 'draft':
        return { registration: 'editable', analysis: 'hidden', response: 'hidden', monitoring: 'hidden', tasks: 'hidden' };
      case 'registered':
        return { registration: 'readonly', analysis: 'hidden', response: 'hidden', monitoring: 'hidden', tasks: 'hidden' };
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
    getSectionsForStatus,
    calculateRiskLevel,
    calculateScore,
  };
}