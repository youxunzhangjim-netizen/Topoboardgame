import type {
  LabExperimentResult,
  LabHash,
  LabId,
  LabJSONValue,
  LabMetadata,
  LabTimestamp
} from './types';

import type {
  LabBatchExperimentConfig,
  LabBatchExportManifest,
  LabBatchFailedRun,
  LabBatchSeedPlan
} from './batch';

export type LabTopologyInvariantExactness =
  | 'exact'
  | 'computed'
  | 'estimated'
  | 'manually_declared'
  | 'unknown';

export type LabTopologyInvariantCategory =
  | 'basic_topology'
  | 'graph'
  | 'cell_complex'
  | 'cycle'
  | 'seam'
  | 'logical'
  | 'diagnostic';

export type LabInitialConditionMappingMethod =
  | 'coordinate_preserving'
  | 'seed_preserving_regeneration'
  | 'density_preserving'
  | 'pattern_projection'
  | 'manual_mapping';

export type LabTopologyComparisonMode =
  | 'synchronized_single_seed'
  | 'multi_seed_statistical'
  | 'replay_comparison';

export type LabTopologySensitiveEventExactness =
  | 'exact'
  | 'computed'
  | 'estimated'
  | 'manually_declared'
  | 'unknown';

export type LabTopologyDivergenceDistanceMethod =
  | 'final_value_difference'
  | 'mean_absolute_time_series_difference'
  | 'normalized_area_between_curves'
  | 'event_count_difference'
  | 'regime_label_mismatch'
  | 'logical_sector_mismatch';

export interface LabTopologyInvariant {
  invariantId: LabId;
  topologyId: LabId;
  name: string;
  value: LabJSONValue;
  category: LabTopologyInvariantCategory;
  definition: string;
  method: string;
  exactness: LabTopologyInvariantExactness;
  limitations: readonly string[];
  topologyHash: LabHash;
  computedAt: LabTimestamp;
}

export interface LabTopologyCycleData {
  topologyId: LabId;
  cycleBasis: readonly LabMetadata[];
  fundamentalCycles: readonly LabMetadata[];
  noncontractibleCycles: readonly LabMetadata[];
  seamEdges: readonly LabMetadata[];
  twistedSeamEdges: readonly LabMetadata[];
  boundaryComponents: readonly LabMetadata[];
  logicalCycles: readonly LabMetadata[];
  homologyGenerators: readonly LabMetadata[];
  exactness: LabTopologyInvariantExactness;
  limitations: readonly string[];
}

export interface LabTopologyComparisonConfig {
  comparisonId: LabId;
  name: string;
  modelId: LabId;
  referenceTopologyId: LabId;
  comparisonTopologyIds: readonly LabId[];
  initialConditionId: LabId;
  initialConditionMappingMethod: LabInitialConditionMappingMethod;
  localRuleId: LabId;
  fixedParameters: LabMetadata;
  seedPlan: LabBatchSeedPlan;
  steps: number;
  selectedObservableIds: readonly LabId[];
  selectedEventDetectorIds: readonly LabId[];
  comparisonMode: LabTopologyComparisonMode;
  appVersion: string;
  createdAt: LabTimestamp;
  comparisonHash: LabHash;
  metadata?: LabMetadata;
}

export interface LabTopologySensitiveEvent {
  eventId: LabId;
  eventType: string;
  modelId: LabId;
  topologyId: LabId;
  step: number;
  time: number;
  affectedSites: readonly LabId[];
  affectedEdges: readonly LabId[];
  affectedFaces: readonly LabId[];
  relatedCycle?: LabMetadata;
  relatedSeam?: LabMetadata;
  relatedObservableIds: readonly LabId[];
  stateHashBefore?: LabHash;
  stateHashAfter?: LabHash;
  confidence: number;
  exactness: LabTopologySensitiveEventExactness;
  limitations: readonly string[];
  metadata?: LabMetadata;
}

export interface LabTopologyDivergenceScore {
  scoreId: LabId;
  comparisonId: LabId;
  referenceTopologyId: LabId;
  comparisonTopologyId: LabId;
  observableId: LabId;
  distanceMethod: LabTopologyDivergenceDistanceMethod;
  normalizationMethod: string;
  seedAggregationMethod: string;
  value: number | null;
  confidence: number;
  limitations: readonly string[];
  metadata?: LabMetadata;
}

export interface LabTopologyObservableComparison {
  observableId: LabId;
  topologyId: LabId;
  seed: string | number;
  finalValue: LabJSONValue;
  timeSeries: readonly LabMetadata[];
  summaryHash: LabHash;
}

export interface LabTopologyComparisonResult {
  comparisonConfig: LabTopologyComparisonConfig;
  batchConfig: LabBatchExperimentConfig;
  topologyInvariants: readonly LabTopologyInvariant[];
  cycleData: readonly LabTopologyCycleData[];
  runResults: readonly LabExperimentResult[];
  topologySensitiveEvents: readonly LabTopologySensitiveEvent[];
  observableComparisons: readonly LabTopologyObservableComparison[];
  divergenceScores: readonly LabTopologyDivergenceScore[];
  failedRuns: readonly LabBatchFailedRun[];
  warnings: readonly string[];
  exportManifest: LabBatchExportManifest | LabMetadata;
  comparisonResultHash: LabHash;
  metadata?: LabMetadata;
}
