import type { LabExperimentConfig } from './types';

export const isingTorusExperimentConfig = {
  experimentId: 'exp.ising.torus.16x16.seed-104392',
  modelId: 'spin-systems.ising',
  topologyId: 'topology.torus.square.16x16.pbc',
  stateSpaceId: 'state-space.ising.spin-half',
  localRuleId: 'rule.ising.domain-wall.metropolis-v1',
  initialConditionId: 'initial.ising.domain-wall-seed',
  validationLevel: 'estimator',
  parameters: {
    temperature: 2.1,
    couplingJ: 1,
    externalField: 0,
    updateSchedule: 'random_sequential',
    boundaryCondition: 'periodic',
    latticeType: 'square',
    dimensions: [16, 16],
    topologyType: 'torus',
    observableCadence: 1,
    snapshotEvery: 10
  },
  seed: 104392,
  steps: 250,
  observables: [
    'observable.ising.energy',
    'observable.ising.magnetization',
    'observable.ising.domain-wall-length',
    'observable.topology.noncontractible-domain-walls'
  ],
  exportOptions: {
    json: true,
    csv: true,
    includeTopology: true,
    includeStateSpace: true,
    includeSnapshots: true,
    includeEventLog: true,
    includeObservableTimeSeries: true,
    precision: 6
  },
  appVersion: '0.1.0',
  createdAt: '2026-06-27T00:00:00.000Z',
  experimentHash: 'sha256:pending-stable-config-hash',
  metadata: {
    section: 'Spin Systems',
    modelName: 'Ising',
    route: '/labs/spin-systems/ising',
    purpose: 'Compare domain-wall stability under periodic torus topology.'
  }
} satisfies LabExperimentConfig;

export const anyonBraidingTorusExperimentConfig = {
  experimentId: 'exp.anyon.toric-code-braid.torus.seed-88017',
  modelId: 'topological-matter.anyons',
  topologyId: 'topology.torus.square.12x12.pbc',
  stateSpaceId: 'state-space.anyon.toric-code',
  localRuleId: 'rule.anyon.braid-and-fuse.toric-code-v1',
  initialConditionId: 'initial.anyon.vacuum-pairs',
  validationLevel: 'toy',
  parameters: {
    anyonModel: 'toric_code',
    braidMemoryMode: 'word_exact',
    entanglementRange: 'infinite',
    captureRequiresUnbraid: true,
    excitationEnergy: 12,
    updateSchedule: 'manual',
    boundaryCondition: 'periodic',
    latticeType: 'square',
    dimensions: [12, 12],
    topologyType: 'torus',
    observableCadence: 1,
    snapshotEvery: 1
  },
  seed: 88017,
  steps: 80,
  observables: [
    'observable.anyon.total-fusion-charge',
    'observable.anyon.logical-sector',
    'observable.anyon.average-braid-word-length',
    'observable.anyon.unbraid-success-rate',
    'observable.qec.memory-alive'
  ],
  exportOptions: {
    json: true,
    csv: true,
    includeTopology: true,
    includeStateSpace: true,
    includeSnapshots: true,
    includeEventLog: true,
    includeObservableTimeSeries: true,
    precision: 6
  },
  appVersion: '0.1.0',
  createdAt: '2026-06-27T00:00:00.000Z',
  experimentHash: 'sha256:pending-stable-config-hash',
  metadata: {
    section: 'Topological Matter',
    modelName: 'Anyons',
    route: '/labs/topological-matter/anyons',
    purpose: 'Replay a toric-code braiding and unbraiding trial on reusable torus topology.'
  }
} satisfies LabExperimentConfig;
