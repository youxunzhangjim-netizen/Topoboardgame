export interface StrategyFeature {
  name: string;
  weight: number;
  appliesTo: string[];
  description: string;
}

export interface StrategyRuleSet {
  schema: 'topoboardgame.ai.strategy_rules.v1';
  gameType: 'chess' | 'go' | 'reversi' | 'chinese-checkers';
  boardScope: 'standard-only' | 'topology-transfer' | 'graph-only';
  generatedAt: string;
  sources: string[];
  features: StrategyFeature[];
}

export function scoreFeatureVector(features: Record<string, number>, rules: StrategyRuleSet): number {
  return rules.features.reduce((total, rule) => total + (features[rule.name] || 0) * rule.weight, 0);
}

