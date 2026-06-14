import {
    createToricCodeMemoryUnbraidProblem,
    TORIC_CODE_MEMORY_UNBRAID_ID,
    topologyOptionsForToricCodeMemoryUnbraid
} from './ToricCodeMemoryUnbraidProblem.js';
import {
    createIsingDomainWallTopologyProblem,
    ISING_DOMAIN_WALL_TOPOLOGY_ID,
    topologyOptionsForIsingDomainWallTopology
} from './IsingDomainWallTopologyProblem.js';
import {
    createStabilizerPauliRecoveryProblem,
    STABILIZER_PAULI_RECOVERY_ID
} from './StabilizerPauliRecoveryProblem.js';
import {
    CFT_CONFORMAL_BLOCK_OBSERVABLES_ID,
    createCFTConformalBlockObservablesProblem
} from './CFTConformalBlockObservablesProblem.js';

export const PHYSICAL_PROBLEM_IDS = Object.freeze([
    TORIC_CODE_MEMORY_UNBRAID_ID,
    ISING_DOMAIN_WALL_TOPOLOGY_ID,
    STABILIZER_PAULI_RECOVERY_ID,
    CFT_CONFORMAL_BLOCK_OBSERVABLES_ID
]);

export function normalizePhysicalProblemId(value = '') {
    const id = typeof value === 'object' ? value?.id : value;
    return PHYSICAL_PROBLEM_IDS.includes(String(id || '')) ? String(id) : '';
}

export function createPhysicalProblem(problem = null, config = {}) {
    const source = typeof problem === 'object' && problem ? problem : { id: problem };
    const id = normalizePhysicalProblemId(source);
    if (id === TORIC_CODE_MEMORY_UNBRAID_ID) {
        return createToricCodeMemoryUnbraidProblem({ ...source, ...config });
    }
    if (id === ISING_DOMAIN_WALL_TOPOLOGY_ID) {
        return createIsingDomainWallTopologyProblem({ ...source, ...config });
    }
    if (id === STABILIZER_PAULI_RECOVERY_ID) {
        return createStabilizerPauliRecoveryProblem({ ...source, ...config });
    }
    if (id === CFT_CONFORMAL_BLOCK_OBSERVABLES_ID) {
        return createCFTConformalBlockObservablesProblem({ ...source, ...config });
    }
    return null;
}

export function topologyOptionsForPhysicalProblem(problem = null, config = {}) {
    const source = typeof problem === 'object' && problem ? problem : { id: problem };
    const id = normalizePhysicalProblemId(source);
    if (id === TORIC_CODE_MEMORY_UNBRAID_ID) {
        return topologyOptionsForToricCodeMemoryUnbraid({ ...source, ...config });
    }
    if (id === ISING_DOMAIN_WALL_TOPOLOGY_ID) {
        return topologyOptionsForIsingDomainWallTopology({ ...source, ...config });
    }
    return null;
}

export {
    runToricMemoryExperiment,
    TORIC_CODE_MEMORY_UNBRAID_ID
} from './ToricCodeMemoryUnbraidProblem.js';
export { ISING_DOMAIN_WALL_TOPOLOGY_ID } from './IsingDomainWallTopologyProblem.js';
export {
    runStabilizerRecoveryExperiment,
    STABILIZER_PAULI_RECOVERY_ID
} from './StabilizerPauliRecoveryProblem.js';
export {
    CFT_CONFORMAL_BLOCK_OBSERVABLES_ID,
    runCFTObservableExperiment
} from './CFTConformalBlockObservablesProblem.js';
