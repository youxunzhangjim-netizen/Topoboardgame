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

export type LabBatchSweepMode = 'fixed' | 'list' | 'range' | 'distribution';
export type LabBatchDistributionType = 'uniform' | 'normal' | 'log_uniform' | 'integer_uniform' | 'choice';
export type LabBatchRuntimeCategory = 'small' | 'medium' | 'large' | 'very_large';
export type LabBatchRunStatus = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled';
export type LabBatchSeedMode = 'single' | 'list' | 'range' | 'generated';
export type LabBatchStepMode = 'fixed' | 'list' | 'checkpoints';

export interface LabBatchParameterSweep {
  parameterId: LabId;
  label: string;
  mode: LabBatchSweepMode;
  fixedValue?: LabJSONValue;
  values?: readonly LabJSONValue[];
  range?: {
    start: number;
    end: number;
    steps: number;
    integer?: boolean;
  };
  distribution?: {
    type: LabBatchDistributionType;
    count: number;
    min?: number;
    max?: number;
    mean?: number;
    standardDeviation?: number;
    choices?: readonly LabJSONValue[];
  };
  units?: string;
  validationLevel?: LabValidationLevel;
  warnings?: readonly string[];
}

export interface LabBatchSeedPlan {
  mode: LabBatchSeedMode;
  singleSeed?: string | number;
  seeds?: readonly (string | number)[];
  range?: {
    start: number;
    end: number;
    step?: number;
  };
  generatedCount?: number;
  generatorSeed?: string | number;
  resolvedSeeds: readonly (string | number)[];
}

export interface LabBatchStepPlan {
  mode: LabBatchStepMode;
  fixedSteps?: number;
  stepCounts?: readonly number[];
  checkpoints?: readonly number[];
  resolvedStepCounts: readonly number[];
}

export interface LabBatchRunConfig {
  runId: LabId;
  experimentConfig: LabExperimentConfig;
  modelId: LabId;
  topologyId: LabId;
  initialConditionId: LabId;
  parameters: LabMetadata;
  seed: string | number;
  steps: number;
  observables: readonly LabId[];
  repeatIndex: number;
  matrixIndex: number;
  status: LabBatchRunStatus;
  runHash: LabHash;
}

export interface LabBatchEstimate {
  configurationCount: number;
  seedCount: number;
  totalRuns: number;
  estimatedMemoryBytes: number;
  estimatedRuntimeCategory: LabBatchRuntimeCategory;
  warnings: readonly string[];
}

export interface LabBatchExperimentConfig {
  batchId: LabId;
  batchName: string;
  selectedModelIds: readonly LabId[];
  selectedTopologyIds: readonly LabId[];
  selectedInitialConditionIds: readonly LabId[];
  parameterSweep: readonly LabBatchParameterSweep[];
  seedPlan: LabBatchSeedPlan;
  stepPlan: LabBatchStepPlan;
  selectedObservableIds: readonly LabId[];
  repeatCount: number;
  runMatrix: readonly LabBatchRunConfig[];
  appVersion: string;
  createdAt: LabTimestamp;
  batchHash: LabHash;
  validationLevel: LabValidationLevel;
  exportOptions?: LabMetadata;
  metadata?: LabMetadata;
}

export interface LabBatchFailedRun {
  runId: LabId;
  experimentConfig?: LabExperimentConfig;
  error: string;
  warnings: readonly string[];
  failedAt: LabTimestamp;
  metadata?: LabMetadata;
}

export interface LabBatchSummaryStatistics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  observableSummary: Record<LabId, LabMetadata>;
  topologySummary: Record<LabId, LabMetadata>;
  parameterSummary: Record<LabId, LabMetadata>;
  seedVariability: Record<LabId, LabMetadata>;
  runtimeMs?: number;
  metadata?: LabMetadata;
}

export interface LabBatchExportFile {
  fileName: string;
  mediaType: string;
  description: string;
  hash?: LabHash;
  bytes?: number;
}

export interface LabBatchExportManifest {
  batchId: LabId;
  batchHash: LabHash;
  batchResultHash?: LabHash;
  appVersion: string;
  createdAt: LabTimestamp;
  exportedAt: LabTimestamp;
  files: readonly LabBatchExportFile[];
  formats: readonly ('json' | 'csv' | 'zip')[];
  reproducibilityNotes: readonly string[];
  validationWarnings: readonly string[];
}

export interface LabBatchExperimentResult {
  batchConfig: LabBatchExperimentConfig;
  runResults: readonly LabExperimentResult[];
  failedRuns: readonly LabBatchFailedRun[];
  warnings: readonly string[];
  summaryStatistics: LabBatchSummaryStatistics;
  exportManifest: LabBatchExportManifest;
  batchResultHash: LabHash;
  metadata?: LabMetadata;
}
