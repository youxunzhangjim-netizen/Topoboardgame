import {
    BaseAnyonRobot,
    BaseChessRobot,
    BaseGoRobot,
    BaseJumpRobot,
    BaseLifeRobot,
    BaseReversiRobot,
    RobotPlayer,
    ROBOT_FAMILIES,
    SUPPORTED_TOPOLOGY_VARIANTS
} from './RobotPlayer.js';

export const MASTER_ENGINE_ROBOTS = Object.freeze({
    chess: {
        engine: 'Stockfish',
        adapter: 'StockfishAdapter',
        directUse: 'normal 2D chess only, with the ordinary flat 8x8 board and no topology/time/lattice options',
        variantUse: 'teacher/baseline only; train separate Topoboardgame chess variant robots for boundary, topology, 3D, 4D, and time modes'
    },
    go: {
        engine: 'KataGo',
        adapter: 'KataGoAdapter',
        directUse: 'normal 2D Go only, with the ordinary flat square board and no topology/time/lattice options',
        variantUse: 'teacher/baseline only; train separate Topoboardgame Go variant robots for torus, Mobius, RP2, sphere, cylinder, lattices, and +1D modes'
    },
    reversi: {
        engine: 'Edax',
        adapter: 'EdaxAdapter',
        directUse: 'normal 2D 8x8 Reversi/Othello only, with the ordinary flat square board and no topology/time/lattice options',
        variantUse: 'teacher/baseline only; train separate Topoboardgame Reversi variant robots for boundary, lattice, 3D, 4D, and +1D modes'
    }
});

export const SPACETIME_MASTER_TEACHERS = Object.freeze({
    chess: {
        layer: '2+1D',
        engine: 'Stockfish',
        adapter: 'StockfishAdapter',
        use: 'teacher/baseline for the spatial chess position only; Time schedule and Age are resolved by Topoboardgame local robots'
    },
    go: {
        layer: '2+1D',
        engine: 'KataGo',
        adapter: 'KataGoAdapter',
        use: 'teacher/baseline for the ordinary square Go projection only; Time schedule, Age, topology, and lattice changes are resolved by Topoboardgame local robots'
    },
    reversi: {
        layer: '2+1D',
        engine: 'Edax',
        adapter: 'EdaxAdapter',
        use: 'teacher/baseline only for normal 8x8 square Reversi/Othello positions; non-8x8, scheduled, topological, and lattice boards are trained as local variants'
    }
});

export const LOCAL_ROBOT_BASELINES = Object.freeze({
    chess: [
        '2D/2dchess/js/robot/ChessRobotAdapter.js',
        '2D/2dchess/js/robot/ChessSearch.js',
        '3D/3dchess/js/robot/Chess3DRobot.js'
    ],
    go: [
        '2D/2dgo/js/robot/GoRobot.js',
        '3D/3dgo/js/robot/Go3DRobot.js'
    ],
    reversi: [
        '2D/2dreversi/js/robot/ReversiRobot.js',
        '3D/3dreversi/js/robot/Reversi3DRobot.js'
    ],
    jump: ['js/shared/JumpRobot.js'],
    life: ['life/js/'],
    anyon: ['algebraic/js/', 'js/localgames/AnyonJump.js']
});

const FAMILY_CLASSES = Object.freeze({
    chess: BaseChessRobot,
    go: BaseGoRobot,
    reversi: BaseReversiRobot,
    jump: BaseJumpRobot,
    life: BaseLifeRobot,
    anyon: BaseAnyonRobot
});

function familyIdFor(gameType) {
    return String(gameType || '').trim().toLowerCase();
}

function normalizedTopology(context = {}) {
    return String(context.topology || context.boundary || context.boundaryCondition || context.mode || 'normal').toLowerCase();
}

function normalizedLattice(context = {}) {
    return String(context.lattice || context.boardLattice || 'square').toLowerCase();
}

function hasAttachedOptions(context = {}) {
    return Boolean(
        context.timeMode
        || context.timeSchedule
        || context.timeEvolution
        || context.delayMode
        || context.ageMode
        || context.periodMode
        || context.topologicalMode
        || context.attachedOptions
        || context.variantOptions
    );
}

export function isDirectMasterEngineContext(context = {}) {
    const gameType = familyIdFor(context.gameType || context.game);
    const dimension = Number(context.dimension || 2);
    const topology = normalizedTopology(context);
    const lattice = normalizedLattice(context);
    const size = Number(context.boardSize || context.size || (gameType === 'reversi' ? 8 : 0));
    if (!MASTER_ENGINE_ROBOTS[gameType] || dimension !== 2 || hasAttachedOptions(context)) return false;
    if (!['normal', 'standard', 'flat', 'forbidden', 'open2d', ''].includes(topology)) return false;
    if (!['square', 'standard', ''].includes(lattice)) return false;
    if (gameType === 'chess') return size === 0 || size === 8;
    if (gameType === 'go') return size === 0 || size >= 2;
    if (gameType === 'reversi') return size === 8;
    return false;
}

export function classifyMasterEngineUse(context = {}) {
    const gameType = familyIdFor(context.gameType || context.game);
    const master = MASTER_ENGINE_ROBOTS[gameType] || null;
    if (!master) {
        return {
            gameType,
            mode: 'local-only',
            direct: false,
            teacherOnly: false,
            reason: 'No open master engine is configured for this game family.'
        };
    }
    if (isDirectMasterEngineContext(context)) {
        return {
            gameType,
            mode: 'direct-master-engine',
            direct: true,
            teacherOnly: false,
            engine: master.engine,
            adapter: master.adapter,
            reason: master.directUse
        };
    }
    const spacetime = String(context.spacetime || context.layer || '').toLowerCase();
    if (['2p1', '2+1d', '2+1'].includes(spacetime) && SPACETIME_MASTER_TEACHERS[gameType]) {
        const teacher = SPACETIME_MASTER_TEACHERS[gameType];
        return {
            gameType,
            mode: 'spacetime-teacher-for-local-variant',
            direct: false,
            teacherOnly: true,
            engine: teacher.engine,
            adapter: teacher.adapter,
            reason: teacher.use
        };
    }
    return {
        gameType,
        mode: 'teacher-for-variant',
        direct: false,
        teacherOnly: true,
        engine: master.engine,
        adapter: master.adapter,
        reason: master.variantUse
    };
}

function modelIdFor({ gameType, variant = 'base', topology = 'normal', modelId = '' }) {
    return modelId || `models/${gameType}/${variant}/${topology}`;
}

export class RobotRegistry {
    constructor() {
        this.families = new Map();
        this.robots = new Map();
        this.localAdapters = new Map();
    }

    registerFamily({
        gameType,
        familyName = '',
        baseRobotClass = RobotPlayer,
        variants = SUPPORTED_TOPOLOGY_VARIANTS,
        notes = '',
        localRobotPaths = []
    }) {
        const id = familyIdFor(gameType);
        const entry = {
            gameType: id,
            familyName: familyName || ROBOT_FAMILIES[id] || `${id}Robot`,
            baseRobotClass,
            variants: [...variants],
            notes,
            localRobotPaths: [...localRobotPaths]
        };
        this.families.set(id, entry);
        return entry;
    }

    registerRobot({ gameType, variant = 'base', topology = 'normal', level = 1, modelId = '', adapter = null, robotClass = null }) {
        const family = this.families.get(familyIdFor(gameType));
        const ClassRef = robotClass || family?.baseRobotClass || RobotPlayer;
        const robot = new ClassRef({
            gameType: familyIdFor(gameType),
            variant,
            topology,
            level,
            modelId: modelIdFor({ gameType: familyIdFor(gameType), variant, topology, modelId }),
            adapter
        });
        this.robots.set(robot.modelId, robot);
        return robot;
    }

    registerLocalAdapter(gameType, adapterFactory) {
        this.localAdapters.set(familyIdFor(gameType), adapterFactory);
    }

    createRobot({ gameType, variant = 'base', topology = 'normal', level = 1, modelId = '', adapter = null } = {}) {
        const familyId = familyIdFor(gameType);
        const id = modelIdFor({ gameType: familyId, variant, topology, modelId });
        if (this.robots.has(id)) return this.robots.get(id);
        const localFactory = this.localAdapters.get(familyId);
        const resolvedAdapter = adapter || (typeof localFactory === 'function'
            ? localFactory({ gameType: familyId, variant, topology, level, modelId: id })
            : null);
        return this.registerRobot({ gameType: familyId, variant, topology, level, modelId: id, adapter: resolvedAdapter });
    }

    listFamilies() {
        return [...this.families.values()].map((entry) => ({ ...entry, variants: [...entry.variants] }));
    }

    listVariants(gameType) {
        return [...(this.families.get(familyIdFor(gameType))?.variants || [])];
    }

    listRobots({ gameType = '' } = {}) {
        const wanted = familyIdFor(gameType);
        return [...this.robots.values()].filter((robot) => !wanted || robot.gameType === wanted);
    }

    masterEnginePolicy(context = {}) {
        return classifyMasterEngineUse(context);
    }
}

export function createDefaultRobotRegistry() {
    const registry = new RobotRegistry();
    for (const [gameType, ClassRef] of Object.entries(FAMILY_CLASSES)) {
        registry.registerFamily({
            gameType,
            baseRobotClass: ClassRef,
            familyName: ROBOT_FAMILIES[gameType],
            localRobotPaths: LOCAL_ROBOT_BASELINES[gameType],
            notes: MASTER_ENGINE_ROBOTS[gameType]
                ? `${MASTER_ENGINE_ROBOTS[gameType].engine} may be used directly only for the normal 2D game. Open engines are teachers/baselines for variants; Topoboardgame local robots are the trainable robots for custom topology games.`
                : 'Topoboardgame local robots are the trainable robots for custom topology games.'
        });
        registry.createRobot({ gameType, variant: 'base', topology: 'normal', modelId: `models/${gameType}/base` });
    }
    return registry;
}

export const defaultRobotRegistry = createDefaultRobotRegistry();
