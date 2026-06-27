import type {
  LabExperimentConfig,
  LabExperimentResult,
  LabHash,
  LabId,
  LabJSONValue,
  LabMetadata,
  LabTimestamp,
  LabValidationLevel
} from './types';

import type {
  LabBatchExperimentConfig,
  LabBatchFailedRun,
  LabBatchRunConfig
} from './batch';

export type LabPhaseAxisInputType = 'numeric_range' | 'numeric_list' | 'log_range' | 'integer_range';
export type LabPhaseClassificationMethod = 'threshold' | 'binning' | 'variance' | 'custom_callback';
export type LabPhaseVisualizationMode =
  | 'heatmap'
  | 'regime_map'
  | 'uncertainty_map'
  | 'topology_comparison'
  | 'observable_curve'
  | 'snapshot_panel';

export type LabRegimeLabel =
  | 'stable'
  | 'mixed'
  | 'fluctuating'
  | 'extinct'
  | 'percolating'
  | 'non-percolating'
  | 'logical-success'
  | 'logical-failure'
  | 'memory-alive'
  | 'memory-lost'
  | 'unknown';

export interface LabPhaseSweepAxis {
  id: LabId;
  label: string;
  parameterId: LabId;
  inputType: LabPhaseAxisInputType;
  values: readonly number[];
  units?: string;
  scale?: 'linear' | 'log';
  integer?: boolean;
  fixedParameters?: Record<LabId, LabJSONValue>;
  warnings?: readonly string[];
}

export interface LabPhaseSeedPlan {
  seeds: readonly (string | number)[];
  repeatsPerCell: number;
  deterministic: true;
}

export interface LabRegimeClassification {
  id: LabId;
  topologyId: LabId;
  xValue: number;
  yValue: number;
  observableId: LabId;
  method: LabPhaseClassificationMethod;
  regimeLabel: LabRegimeLabel;
  meanValue: number | null;
  variance: number | null;
  confidence: number;
  thresholds?: {
    lower?: number;
    upper?: number;
    bins?: readonly number[];
  };
  sampleCount: number;
  failedRunCount: number;
  limitations: readonly string[];
  classificationHash: LabHash;
  metadata?: LabMetadata;
}

export interface LabPhaseScanConfig {
  phaseScanId: LabId;
  title: string;
  modelId: LabId;
  topologyIds: readonly LabId[];
  xAxis: LabPhaseSweepAxis;
  yAxis: LabPhaseSweepAxis;
  seedPlan: LabPhaseSeedPlan;
  steps: number;
  initialConditionId: LabId;
  classificationObservableId: LabId;
  auxiliaryObservableIds: readonly LabId[];
  classificationMethod: LabPhaseClassificationMethod;
  classificationParameters: LabMetadata;
  validationLevel: LabValidationLevel;
  visualizationModes: readonly LabPhaseVisualizationMode[];
  exportOptions: {
    json: boolean;
    csv: boolean;
    includeRawRuns: boolean;
    includeManifest: boolean;
    includeReproducibilityNotes: boolean;
  };
  appVersion: string;
  createdAt: LabTimestamp;
  experimentHash: LabHash;
  metadata?: LabMetadata;
}

export interface LabPhaseGridCellResult {
  topologyId: LabId;
  xValue: number;
  yValue: number;
  runIds: readonly LabId[];
  observableSummary: Record<LabId, LabJSONValue>;
  classification: LabRegimeClassification;
  selectedSnapshotIds: readonly LabId[];
  warnings: readonly string[];
  cellHash: LabHash;
}

export interface LabPhaseTopologyComparison {
  topologyId: LabId;
  topologyHash: LabHash;
  completedCells: number;
  failedCells: number;
  dominantRegimes: Record<LabRegimeLabel, number>;
  boundaryEstimate?: {
    parameterPath: readonly { x: number; y: number; confidence: number }[];
    limitations: readonly string[];
  };
  metadata?: LabMetadata;
}

export interface LabPhaseScanResult {
  config: LabPhaseScanConfig;
  batchConfig: LabBatchExperimentConfig;
  batchRunMatrix: readonly LabBatchRunConfig[];
  experimentConfigs: readonly LabExperimentConfig[];
  runResults: readonly LabExperimentResult[];
  failedRuns: readonly LabBatchFailedRun[];
  gridCells: readonly LabPhaseGridCellResult[];
  classifications: readonly LabRegimeClassification[];
  topologyComparisons: readonly LabPhaseTopologyComparison[];
  observableCurves: Record<LabId, LabMetadata>;
  snapshots: readonly LabMetadata[];
  warnings: readonly string[];
  manifest: {
    phaseScanId: LabId;
    phaseScanHash: LabHash;
    batchHash: LabHash;
    appVersion: string;
    exportedAt?: LabTimestamp;
    files: readonly {
      fileName: string;
      mediaType: string;
      description: string;
    }[];
    reproducibilityNotes: readonly string[];
    validationWarnings: readonly string[];
  };
  resultHash: LabHash;
  metadata?: LabMetadata;
}
