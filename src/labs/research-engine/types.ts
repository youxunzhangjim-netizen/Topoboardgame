export type LabId = string;
export type LabHash = string;
export type LabTimestamp = string;
export type LabValidationLevel = 'toy' | 'estimator' | 'benchmarked' | 'research_grade';

export type LabJSONPrimitive = string | number | boolean | null;
export type LabJSONValue = LabJSONPrimitive | LabJSONValue[] | { [key: string]: LabJSONValue };
export type LabMetadata = Record<string, LabJSONValue>;

export type LabTopologyType =
  | 'open'
  | 'periodic'
  | 'cylinder'
  | 'torus'
  | 'klein_bottle'
  | 'mobius'
  | 'rp2'
  | 'sphere'
  | 'random_boundary'
  | 'graph'
  | 'cell_complex'
  | 'higher_dimensional';

export type LabLatticeType =
  | 'square'
  | 'triangular'
  | 'honeycomb'
  | 'hex_cells'
  | 'cubic'
  | 'latitude'
  | 'irregular'
  | 'custom_graph';

export type LabBoundaryCondition =
  | 'open'
  | 'periodic'
  | 'twisted'
  | 'identified'
  | 'random_boundary'
  | 'closed_manifold'
  | 'custom';

export type LabStateEncoding =
  | 'enum'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'bitset'
  | 'vector'
  | 'matrix'
  | 'symbolic'
  | 'json';

export type LabObservableCategory =
  | 'energy'
  | 'order_parameter'
  | 'topology'
  | 'geometry'
  | 'correlation'
  | 'entropy'
  | 'defect'
  | 'charge'
  | 'flux'
  | 'braid'
  | 'fusion'
  | 'logical'
  | 'transport'
  | 'count'
  | 'distribution'
  | 'diagnostic'
  | 'custom';

export type LabEstimatorType =
  | 'exact_discrete'
  | 'graph_estimator'
  | 'monte_carlo'
  | 'sampling'
  | 'symbolic'
  | 'heuristic'
  | 'external_engine'
  | 'custom';

export type LabUpdateSchedule =
  | 'synchronous'
  | 'asynchronous'
  | 'sequential'
  | 'random_sequential'
  | 'event_driven'
  | 'manual'
  | 'hybrid';

export type LabDynamicsStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error';

export type LabCoordinate = readonly number[];

export interface LabSite {
  id: LabId;
  index: number;
  coord: LabCoordinate;
  position?: LabCoordinate;
  boundaryRole?: 'interior' | 'boundary' | 'identified' | 'singular' | 'virtual';
  metadata?: LabMetadata;
}

export interface LabEdge {
  id: LabId;
  source: LabId;
  target: LabId;
  directed?: boolean;
  orientation?: 1 | -1;
  weight?: number;
  boundaryRole?: 'interior' | 'boundary' | 'identified' | 'twist' | 'virtual';
  metadata?: LabMetadata;
}

export interface LabFace {
  id: LabId;
  siteIds?: readonly LabId[];
  edgeIds: readonly LabId[];
  orientation?: readonly number[];
  metadata?: LabMetadata;
}

export interface LabOrientationData {
  edgeOrientations?: Record<LabId, 1 | -1>;
  faceOrientations?: Record<LabId, readonly number[]>;
  seamTransforms?: Record<LabId, LabMetadata>;
  localFrames?: Record<LabId, LabMetadata>;
}

export interface LabTopologyInvariants {
  eulerCharacteristic?: number;
  genus?: number;
  orientable?: boolean;
  boundaryComponentCount?: number;
  connectedComponentCount?: number;
  bettiNumbers?: readonly number[];
  homologySummary?: string;
  fundamentalCycles?: readonly LabId[];
  metadata?: LabMetadata;
}

export interface LabAdjacency {
  siteNeighbors: Record<LabId, readonly LabId[]>;
  edgeNeighbors?: Record<LabId, readonly LabId[]>;
  incidentEdges?: Record<LabId, readonly LabId[]>;
  incidentFaces?: Record<LabId, readonly LabId[]>;
  boundaryMaps?: Record<LabId, LabId>;
  metadata?: LabMetadata;
}

export interface LabTopology {
  id: LabId;
  name: string;
  dimension: number;
  topologyType: LabTopologyType;
  latticeType: LabLatticeType;
  boundaryCondition: LabBoundaryCondition;
  sites: readonly LabSite[];
  edges: readonly LabEdge[];
  faces?: readonly LabFace[];
  adjacency: LabAdjacency;
  orientationData?: LabOrientationData;
  topologyInvariants?: LabTopologyInvariants;
  topologyHash: LabHash;
  metadata?: LabMetadata;
}

export interface LabLocalState {
  id: LabId;
  label: string;
  encodedValue: LabJSONValue;
  description?: string;
  metadata?: LabMetadata;
}

export interface LabStateConstraint {
  id: LabId;
  name: string;
  description: string;
  scope: 'site' | 'edge' | 'face' | 'global' | 'topological';
  severity: 'required' | 'recommended' | 'diagnostic';
  metadata?: LabMetadata;
}

export interface LabStateInterpretation {
  summary: string;
  variables: Record<string, string>;
  physicalMeaning?: string;
  mathematicalMeaning?: string;
  informationMeaning?: string;
  notes?: readonly string[];
}

export interface LabStateSpace {
  id: LabId;
  name: string;
  localStates: readonly LabLocalState[];
  stateEncoding: LabStateEncoding;
  constraints: readonly LabStateConstraint[];
  interpretation: LabStateInterpretation;
  validationLevel: LabValidationLevel;
  metadata?: LabMetadata;
}

export interface LabState {
  topologyId: LabId;
  stateSpaceId: LabId;
  step: number;
  time: number;
  siteStates: Record<LabId, LabJSONValue>;
  edgeStates?: Record<LabId, LabJSONValue>;
  faceStates?: Record<LabId, LabJSONValue>;
  metadata: LabMetadata;
  stateHash: LabHash;
}

export interface LabRuleNeighborhoodDefinition {
  scope: 'site' | 'edge' | 'face' | 'cluster' | 'path' | 'cycle' | 'global';
  radius?: number;
  usesTopologyAdjacency: boolean;
  usesOrientation?: boolean;
  usesBoundaryMaps?: boolean;
  description: string;
  metadata?: LabMetadata;
}

export interface LabRuleApplicationContext {
  topology: LabTopology;
  stateSpace: LabStateSpace;
  seed: string | number;
  rng: LabRandomSource;
  parameters: LabMetadata;
  step: number;
  time: number;
  eventLog: LabEvent[];
}

export interface LabRuleApplicationResult {
  nextState: LabState;
  events: readonly LabEvent[];
  warnings?: readonly string[];
  metadata?: LabMetadata;
}

export type LabRuleApplyFunction = (
  state: LabState,
  context: LabRuleApplicationContext
) => LabRuleApplicationResult | Promise<LabRuleApplicationResult>;

export interface LabLocalRule {
  id: LabId;
  name: string;
  modelFamily: string;
  stochastic: boolean;
  deterministic: boolean;
  validationLevel: LabValidationLevel;
  parameters: LabMetadata;
  neighborhoodDefinition: LabRuleNeighborhoodDefinition;
  updateSchedule: LabUpdateSchedule;
  applyRule: LabRuleApplyFunction;
  ruleHash: LabHash;
  metadata?: LabMetadata;
}

export interface LabRandomSource {
  seed: string | number;
  next(): number;
  fork(label: string): LabRandomSource;
  stateHash(): LabHash;
}

export interface LabEvent {
  id: LabId;
  step: number;
  time: number;
  type: string;
  source: 'engine' | 'rule' | 'observable' | 'user' | 'import' | 'replay';
  affectedSites?: readonly LabId[];
  affectedEdges?: readonly LabId[];
  affectedFaces?: readonly LabId[];
  payload?: LabMetadata;
  eventHash: LabHash;
}

export interface LabDynamicsRunOptions {
  steps?: number;
  untilStep?: number;
  snapshotEvery?: number;
  computeObservablesEvery?: number;
  stopWhen?: (state: LabState, context: LabDynamicsContext) => boolean;
}

export interface LabDynamicsContext {
  config: LabExperimentConfig;
  topology: LabTopology;
  stateSpace: LabStateSpace;
  localRule: LabLocalRule;
  observables: readonly LabObservable[];
  rng: LabRandomSource;
  eventLog: LabEvent[];
  snapshots: LabStateSnapshot[];
}

export interface LabDynamicsEngine {
  readonly status: LabDynamicsStatus;
  readonly config: LabExperimentConfig;
  readonly currentState: LabState;
  readonly eventLog: readonly LabEvent[];
  readonly seed: string | number;
  step(): Promise<LabState>;
  run(options?: LabDynamicsRunOptions): Promise<LabExperimentResult>;
  pause(): void;
  reset(config?: LabExperimentConfig): Promise<LabState>;
  replay(result: LabExperimentResult, options?: { untilStep?: number }): Promise<LabExperimentResult>;
  getEventLog(): readonly LabEvent[];
}

export interface LabObservableComputationContext {
  topology: LabTopology;
  stateSpace: LabStateSpace;
  localRule: LabLocalRule;
  config: LabExperimentConfig;
  eventLog: readonly LabEvent[];
}

export type LabObservableValue = number | string | boolean | readonly number[] | LabMetadata;

export interface LabObservableSample {
  step: number;
  time: number;
  value: LabObservableValue;
  sampleHash: LabHash;
  metadata?: LabMetadata;
}

export type LabObservableComputeFunction = (
  state: LabState,
  context: LabObservableComputationContext
) => LabObservableValue | Promise<LabObservableValue>;

export interface LabObservable {
  id: LabId;
  name: string;
  category: LabObservableCategory;
  definition: string;
  physicalMeaning: string;
  units: string;
  estimatorType: LabEstimatorType;
  validationLevel: LabValidationLevel;
  compute: LabObservableComputeFunction;
  currentValue: LabObservableValue | null;
  timeSeries: readonly LabObservableSample[];
  limitations: readonly string[];
  exportKey?: string;
  metadata?: LabMetadata;
}

export interface LabExportOptions {
  json: boolean;
  csv: boolean;
  includeTopology: boolean;
  includeStateSpace: boolean;
  includeSnapshots: boolean;
  includeEventLog: boolean;
  includeObservableTimeSeries: boolean;
  precision?: number;
}

export interface LabExperimentConfig {
  experimentId: LabId;
  modelId: LabId;
  topologyId: LabId;
  stateSpaceId: LabId;
  localRuleId: LabId;
  initialConditionId: LabId;
  validationLevel: LabValidationLevel;
  parameters: LabMetadata;
  seed: string | number;
  steps: number;
  observables: readonly LabId[];
  exportOptions: LabExportOptions;
  appVersion: string;
  createdAt: LabTimestamp;
  experimentHash: LabHash;
  metadata?: LabMetadata;
}

export interface LabStateSnapshot {
  id: LabId;
  step: number;
  time: number;
  stateHash: LabHash;
  state?: LabState;
  preview?: LabMetadata;
  snapshotHash: LabHash;
}

export interface LabExperimentSummary {
  status: 'complete' | 'paused' | 'stopped' | 'failed';
  finalStep: number;
  finalTime: number;
  stableConfiguration?: boolean;
  observableSummary: Record<LabId, LabObservableValue>;
  interpretation?: string;
  limitations?: readonly string[];
  metadata?: LabMetadata;
}

export interface LabExperimentResult {
  config: LabExperimentConfig;
  finalState: LabState;
  observableTimeSeries: Record<LabId, readonly LabObservableSample[]>;
  eventLog: readonly LabEvent[];
  snapshots: readonly LabStateSnapshot[];
  summary: LabExperimentSummary;
  warnings: readonly string[];
  resultHash: LabHash;
  metadata?: LabMetadata;
}
