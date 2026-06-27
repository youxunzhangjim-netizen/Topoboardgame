import type {
  LabExperimentConfig,
  LabExperimentResult,
  LabHash,
  LabId,
  LabJSONValue,
  LabMetadata,
  LabObservable,
  LabState,
  LabStateSpace,
  LabTimestamp,
  LabTopology,
  LabValidationLevel
} from './types';

import type {
  LabBatchExperimentConfig,
  LabBatchExperimentResult,
  LabBatchExportManifest
} from './batch';

import type {
  LabPhaseScanConfig,
  LabPhaseScanResult
} from './phase';

import type {
  LabTopologyComparisonConfig,
  LabTopologyComparisonResult,
  LabTopologyInvariant,
  LabTopologyInvariantExactness
} from './topology-comparison';

export type LabSchemaVersion = string;
export type LabHashAlgorithm = 'fnv1a32' | 'sha256' | 'external';
export type LabHashVersion = string;
export type LabRNGAlgorithm = 'mulberry32' | 'xorshift32' | 'external' | 'unknown';
export type LabRNGStreamId =
  | 'initialCondition'
  | 'dynamics'
  | 'noise'
  | 'measurement'
  | 'userRandomization'
  | 'visualizationOnly'
  | 'custom';

export type LabLoadedResearchObject =
  | LabExperimentConfig
  | LabExperimentResult
  | LabBatchExperimentConfig
  | LabBatchExperimentResult
  | LabPhaseScanConfig
  | LabPhaseScanResult
  | LabTopologyComparisonConfig
  | LabTopologyComparisonResult
  | LabBatchExportManifest
  | LabReproducibilityBundleManifest
  | LabMetadata;

export type LabReplayMode =
  | 'config_seed'
  | 'event_log'
  | 'strict'
  | 'approximate';

export type LabReplayComparisonStatus =
  | 'exact_match'
  | 'state_hash_mismatch'
  | 'observable_mismatch'
  | 'event_log_mismatch'
  | 'unsupported_replay'
  | 'partially_reproducible';

export type LabBenchmarkTargetType =
  | 'model'
  | 'topology'
  | 'observable'
  | 'engine'
  | 'export'
  | 'replay';

export type LabBenchmarkStatus =
  | 'not_run'
  | 'passed'
  | 'failed'
  | 'warning'
  | 'unsupported'
  | 'stale';

export type LabBenchmarkCategory =
  | 'engine'
  | 'topology'
  | 'model'
  | 'observable'
  | 'export'
  | 'replay'
  | 'hashing'
  | 'rng';

export type LabObservableExactness =
  | 'exact'
  | 'computed'
  | 'estimated'
  | 'manually_declared'
  | 'unknown';

export type LabValidationReportStatus =
  | 'reproducible'
  | 'partially_reproducible'
  | 'not_reproducible'
  | 'benchmark_passed'
  | 'benchmark_failed'
  | 'warning'
  | 'insufficient_metadata';

export type LabAuditWarningSeverity =
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export interface LabPlatformInfo {
  userAgent?: string;
  language?: string;
  timezone?: string;
  hardwareConcurrency?: number;
  platform?: string;
  rendererRelevant: false;
  metadata?: LabMetadata;
}

export interface LabReproducibilityMetadata {
  schemaName: string;
  schemaVersion: LabSchemaVersion;
  appVersion: string;
  modelVersion: string;
  engineVersion: string;
  topologyRegistryVersion: string;
  observableRegistryVersion: string;
  ruleRegistryVersion: string;
  rngAlgorithm: LabRNGAlgorithm;
  rngSeed: string | number | null;
  seedPlan: LabJSONValue;
  platformInfo?: LabPlatformInfo;
  createdAt: LabTimestamp;
  configHash: LabHash;
  stateHashInitial?: LabHash;
  stateHashFinal?: LabHash;
  eventLogHash?: LabHash;
  resultHash?: LabHash;
  exportManifestHash?: LabHash;
  deterministicReplaySupported: boolean;
  knownNonDeterministicComponents: readonly string[];
  warnings: readonly string[];
}

export interface LabCanonicalSerializationOptions {
  hashVersion: LabHashVersion;
  excludeUiOnlyFields: boolean;
  excludeTimestamps: boolean;
  excludedFields: readonly string[];
  includedFields?: readonly string[];
  notes?: readonly string[];
}

export interface LabHashAudit {
  objectType: string;
  objectId?: LabId;
  hashValue: LabHash;
  fieldsIncluded: readonly string[];
  fieldsExcluded: readonly string[];
  hashAlgorithm: LabHashAlgorithm;
  hashVersion: LabHashVersion;
  canonicalSerializationHash: LabHash;
  warnings: readonly LabAuditWarning[];
  metadata?: LabMetadata;
}

export interface LabRNGSnapshot {
  rngAlgorithm: LabRNGAlgorithm;
  baseSeed: string | number;
  streamId: LabRNGStreamId | string;
  currentCounter: number;
  stateHash: LabHash;
  metadata?: LabMetadata;
}

export interface LabRNGContext {
  rngAlgorithm: LabRNGAlgorithm;
  baseSeed: string | number;
  streamId: LabRNGStreamId | string;
  currentCounter: number;
  draw(label?: string): number;
  fork(streamId: LabRNGStreamId | string): LabRNGContext;
  serialize(): LabRNGSnapshot;
  restore(snapshot: LabRNGSnapshot): LabRNGContext;
}

export interface LabReplayEvent {
  eventId: LabId;
  eventType: string;
  step: number;
  time: number;
  modelId: LabId;
  topologyId: LabId;
  payload: LabMetadata;
  stateHashBefore?: LabHash;
  stateHashAfter?: LabHash;
  rngStateBefore?: LabRNGSnapshot;
  rngStateAfter?: LabRNGSnapshot;
  replayable: boolean;
  nonReplayableReason?: string;
  createdAt: LabTimestamp;
}

export interface LabReplayResult {
  replayId: LabId;
  mode: LabReplayMode;
  status: LabReplayComparisonStatus;
  targetObjectId?: LabId;
  replayedResult?: LabExperimentResult | LabMetadata;
  comparison: {
    stateHashMatch?: boolean;
    observableMatch?: boolean;
    eventLogMatch?: boolean;
    resultHashMatch?: boolean;
    details: readonly string[];
  };
  warnings: readonly LabAuditWarning[];
  limitations: readonly string[];
  replayHash: LabHash;
}

export interface LabValidationLevelDefinition {
  level: LabValidationLevel;
  description: string;
  requirements: readonly string[];
  nextLevelRequires: readonly string[];
}

export interface LabBenchmark {
  benchmarkId: LabId;
  name: string;
  category: LabBenchmarkCategory;
  targetType: LabBenchmarkTargetType;
  targetId: LabId;
  description: string;
  validationLevelImpact: LabValidationLevel | 'none';
  config: LabMetadata;
  expectedResult: LabJSONValue;
  tolerance?: number;
  method: string;
  references?: readonly string[];
  limitations: readonly string[];
  runBenchmark?: (context: LabBenchmarkRunContext) => LabBenchmarkRunResult | Promise<LabBenchmarkRunResult>;
  lastRunAt?: LabTimestamp;
  lastStatus: LabBenchmarkStatus;
}

export interface LabBenchmarkRunContext {
  target?: LabLoadedResearchObject;
  modelId?: LabId;
  topology?: LabTopology | LabMetadata;
  observable?: LabObservable | LabMetadata;
  rng?: LabRNGContext;
  metadata?: LabMetadata;
}

export interface LabBenchmarkRunResult {
  benchmarkId: LabId;
  status: LabBenchmarkStatus;
  measuredValue?: LabJSONValue;
  expectedResult?: LabJSONValue;
  tolerance?: number;
  message: string;
  warnings: readonly LabAuditWarning[];
  limitations: readonly string[];
  runAt: LabTimestamp;
  resultHash: LabHash;
}

export interface LabBenchmarkRegistry {
  registryId: LabId;
  registryVersion: string;
  benchmarks: readonly LabBenchmark[];
  metadata?: LabMetadata;
}

export interface LabObservableConsistencyCheck {
  observableId: LabId;
  definition: string;
  computeMethod: string;
  dependencies: readonly string[];
  exactness: LabObservableExactness;
  validRange?: { min?: number; max?: number; inclusive?: boolean };
  units: string;
  limitations: readonly string[];
  benchmarkStatus: LabBenchmarkStatus;
  lastTestedResult?: LabBenchmarkRunResult;
  warnings: readonly LabAuditWarning[];
  checkHash: LabHash;
}

export interface LabTopologyValidationCheck {
  topologyId: LabId;
  declaredInvariants: readonly LabTopologyInvariant[];
  computedInvariants: readonly LabTopologyInvariant[];
  exactnessLabels: Record<LabId, LabTopologyInvariantExactness>;
  consistencyWarnings: readonly LabAuditWarning[];
  cycleAndSeamMetadata: LabMetadata;
  compatibleModelIds: readonly LabId[];
  checks: Record<string, LabBenchmarkStatus>;
  checkHash: LabHash;
}

export interface LabValidationReport {
  reportId: LabId;
  reportType: 'experiment' | 'batch' | 'phase_scan' | 'topology_comparison' | 'manifest' | 'unknown';
  generatedAt: LabTimestamp;
  appVersion: string;
  schemaVersion: LabSchemaVersion;
  targetObjectType: string;
  targetObjectId?: LabId;
  reproducibilityStatus: LabValidationReportStatus;
  replayStatus: LabReplayComparisonStatus;
  benchmarkResults: readonly LabBenchmarkRunResult[];
  observableChecks: readonly LabObservableConsistencyCheck[];
  topologyChecks: readonly LabTopologyValidationCheck[];
  hashAudit: readonly LabHashAudit[];
  warnings: readonly LabAuditWarning[];
  failures: readonly LabAuditWarning[];
  recommendations: readonly string[];
  reportHash: LabHash;
}

export interface LabReproducibilityBundleManifest {
  schemaName: 'LabReproducibilityBundleManifest';
  schemaVersion: LabSchemaVersion;
  bundleId: LabId;
  bundleName: string;
  createdAt: LabTimestamp;
  appVersion: string;
  includedFiles: readonly {
    path: string;
    mediaType: string;
    description: string;
    hash?: LabHash;
  }[];
  configHash?: LabHash;
  resultHash?: LabHash;
  eventLogHash?: LabHash;
  validationReportHash?: LabHash;
  benchmarkReportHashes: readonly LabHash[];
  warnings: readonly LabAuditWarning[];
  reproducibilityStatus: LabValidationReportStatus;
  limitations: readonly string[];
  manifestHash: LabHash;
}

export interface LabReproducibilityBundle {
  manifest: LabReproducibilityBundleManifest;
  experimentConfig?: LabExperimentConfig | LabBatchExperimentConfig | LabPhaseScanConfig | LabTopologyComparisonConfig | LabMetadata;
  result?: LabExperimentResult | LabBatchExperimentResult | LabPhaseScanResult | LabTopologyComparisonResult | LabMetadata;
  topology?: LabTopology | LabMetadata;
  adjacency?: LabMetadata;
  stateSpace?: LabStateSpace | LabMetadata;
  localRule?: LabMetadata;
  observableDefinitions?: readonly LabMetadata[];
  eventLog?: readonly LabReplayEvent[] | readonly LabMetadata[];
  rngMetadata?: LabRNGSnapshot | LabMetadata;
  benchmarkReport?: readonly LabBenchmarkRunResult[];
  validationReport: LabValidationReport;
  readme: string;
  citationMetadata?: LabMetadata;
}

export interface LabSchemaMigration {
  migrationId: LabId;
  fromSchema: string;
  fromVersion: LabSchemaVersion;
  toSchema: string;
  toVersion: LabSchemaVersion;
  description: string;
  migrate: (input: LabLoadedResearchObject) => LabLoadedResearchObject;
  limitations: readonly string[];
  dataLossPossible: boolean;
}

export interface LabSchemaMigrationResult {
  migrated: boolean;
  supported: boolean;
  originalSchema?: string;
  originalVersion?: LabSchemaVersion;
  targetSchema?: string;
  targetVersion?: LabSchemaVersion;
  object: LabLoadedResearchObject;
  warnings: readonly LabAuditWarning[];
}

export interface LabAuditWarning {
  warningId: LabId;
  severity: LabAuditWarningSeverity;
  message: string;
  affectedObject?: {
    objectType: string;
    objectId?: LabId;
    fieldPath?: string;
  };
  recommendation: string;
  canProceed: boolean;
}
