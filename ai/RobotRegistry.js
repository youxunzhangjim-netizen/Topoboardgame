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
}

export function createDefaultRobotRegistry() {
    const registry = new RobotRegistry();
    for (const [gameType, ClassRef] of Object.entries(FAMILY_CLASSES)) {
        registry.registerFamily({
            gameType,
            baseRobotClass: ClassRef,
            familyName: ROBOT_FAMILIES[gameType],
            localRobotPaths: LOCAL_ROBOT_BASELINES[gameType],
            notes: 'Open engines are teachers/baselines only. Topoboardgame local robots are the trainable robots for custom topology games.'
        });
        registry.createRobot({ gameType, variant: 'base', topology: 'normal', modelId: `models/${gameType}/base` });
    }
    return registry;
}

export const defaultRobotRegistry = createDefaultRobotRegistry();
