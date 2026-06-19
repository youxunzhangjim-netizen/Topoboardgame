import { createModelMetadata, defaultModelDirectory, ModelStore } from './ModelStore.js';
import { selfPlayRecordToExamples } from './TrainingDataRecorder.js';

export const TRAINING_METHODS = Object.freeze({
    heuristicImitation: 'heuristic-imitation',
    teacherImitation: 'teacher-imitation',
    selfPlayPolicyValue: 'self-play-policy-value',
    mctsImprovement: 'mcts-improvement',
    variantFineTuning: 'variant-fine-tuning',
    optInPlayerLearning: 'opt-in-player-learning'
});

export const VARIANT_FINE_TUNE_EXAMPLES = Object.freeze([
    { from: 'BaseChessRobot', to: 'CubeChessRobot', gameType: 'chess', variant: 'cube', topology: 'cube' },
    { from: 'BaseChessRobot', to: 'TorusChessRobot', gameType: 'chess', variant: 'torus', topology: 'torus' },
    { from: 'BaseGoRobot', to: 'CylinderGoRobot', gameType: 'go', variant: 'cylinder', topology: 'cylinder' },
    { from: 'BaseReversiRobot', to: 'CylinderReversiRobot', gameType: 'reversi', variant: 'cylinder', topology: 'cylinder' },
    { from: 'BaseReversiRobot', to: 'KleinReversiRobot', gameType: 'reversi', variant: 'klein', topology: 'klein' },
    { from: 'BaseJumpRobot', to: 'PolarJumpRobot', gameType: 'jump', variant: 'polar', topology: 'polar' },
    { from: 'BaseJumpRobot', to: 'TriangularJumpRobot', gameType: 'jump', variant: 'triangular', topology: 'plane' },
    { from: 'BaseJumpRobot', to: 'Jump4DRobot', gameType: 'jump', variant: '4d', topology: '4d' },
    { from: 'BaseAnyonRobot', to: 'FusionTargetAnyonRobot', gameType: 'anyon', variant: 'fusion', topology: 'fusion' }
]);

function countExamples(examples = []) {
    return Array.isArray(examples) ? examples.length : 0;
}

function nowIso() {
    return new Date().toISOString();
}

function compactTrainingNotes({ method, exampleCount, teacher = '', notes = '' }) {
    return [
        `method=${method}`,
        `examples=${exampleCount}`,
        teacher ? `teacher=${teacher}` : '',
        notes
    ].filter(Boolean).join('; ');
}

export class VariantTrainer {
    constructor({ modelStore = new ModelStore(), registry = null } = {}) {
        this.modelStore = modelStore;
        this.registry = registry;
    }

    async trainHeuristicImitation({
        gameType,
        variant = 'base',
        topology = 'normal',
        examples = [],
        baseModelId = '',
        rulesVersion = 'local-current',
        notes = ''
    } = {}) {
        return this.saveTrainingRun({
            gameType,
            variant,
            topology,
            baseModelId,
            rulesVersion,
            trainingSource: TRAINING_METHODS.heuristicImitation,
            examples,
            evaluationNotes: compactTrainingNotes({
                method: TRAINING_METHODS.heuristicImitation,
                exampleCount: countExamples(examples),
                notes
            })
        });
    }

    async trainTeacherImitation({
        gameType,
        variant = 'base',
        topology = 'normal',
        examples = [],
        teacher = '',
        baseModelId = '',
        rulesVersion = 'local-current',
        notes = ''
    } = {}) {
        return this.saveTrainingRun({
            gameType,
            variant,
            topology,
            baseModelId,
            rulesVersion,
            trainingSource: TRAINING_METHODS.teacherImitation,
            examples,
            evaluationNotes: compactTrainingNotes({
                method: TRAINING_METHODS.teacherImitation,
                exampleCount: countExamples(examples),
                teacher,
                notes
            })
        });
    }

    async trainSelfPlayPolicyValue({
        gameType,
        variant = 'base',
        topology = 'normal',
        records = [],
        examples = null,
        baseModelId = '',
        rulesVersion = 'local-current',
        notes = ''
    } = {}) {
        const modelExamples = examples || records.flatMap((record) => selfPlayRecordToExamples(record));
        return this.saveTrainingRun({
            gameType,
            variant,
            topology,
            baseModelId,
            rulesVersion,
            trainingSource: TRAINING_METHODS.selfPlayPolicyValue,
            examples: modelExamples,
            evaluationNotes: compactTrainingNotes({
                method: TRAINING_METHODS.selfPlayPolicyValue,
                exampleCount: countExamples(modelExamples),
                notes
            })
        });
    }

    async trainMctsImprovement({
        gameType,
        variant = 'base',
        topology = 'normal',
        examples = [],
        baseModelId = '',
        rulesVersion = 'local-current',
        notes = ''
    } = {}) {
        return this.saveTrainingRun({
            gameType,
            variant,
            topology,
            baseModelId,
            rulesVersion,
            trainingSource: TRAINING_METHODS.mctsImprovement,
            examples,
            evaluationNotes: compactTrainingNotes({
                method: TRAINING_METHODS.mctsImprovement,
                exampleCount: countExamples(examples),
                notes: notes || 'MCTS data should use local policy/value guidance and store search-improved move distributions.'
            })
        });
    }

    async fineTuneVariant({
        gameType,
        baseModelId,
        targetVariant,
        targetTopology = targetVariant,
        examples = [],
        rulesVersion = 'local-current',
        ratingEstimate = null,
        notes = ''
    } = {}) {
        if (!gameType) throw new Error('fineTuneVariant requires gameType.');
        if (!targetVariant) throw new Error('fineTuneVariant requires targetVariant.');
        return this.saveTrainingRun({
            gameType,
            variant: targetVariant,
            topology: targetTopology,
            baseModelId,
            rulesVersion,
            trainingSource: TRAINING_METHODS.variantFineTuning,
            examples,
            ratingEstimate,
            evaluationNotes: compactTrainingNotes({
                method: TRAINING_METHODS.variantFineTuning,
                exampleCount: countExamples(examples),
                notes: notes || 'Variant model saved separately to avoid catastrophic forgetting of the base robot.'
            })
        });
    }

    async learnFromOptInPlayerGame({
        gameType,
        variant = 'base',
        topology = 'normal',
        examples = [],
        baseModelId = '',
        rulesVersion = 'local-current',
        notes = ''
    } = {}) {
        return this.saveTrainingRun({
            gameType,
            variant,
            topology,
            baseModelId,
            rulesVersion,
            trainingSource: TRAINING_METHODS.optInPlayerLearning,
            examples,
            evaluationNotes: compactTrainingNotes({
                method: TRAINING_METHODS.optInPlayerLearning,
                exampleCount: countExamples(examples),
                notes: notes || 'Only opt-in player games are used for learning.'
            })
        });
    }

    async saveTrainingRun({
        gameType,
        variant,
        topology,
        baseModelId = '',
        rulesVersion = 'local-current',
        trainingSource,
        examples = [],
        ratingEstimate = null,
        evaluationNotes = ''
    } = {}) {
        const directory = defaultModelDirectory(gameType, variant);
        const metadata = createModelMetadata({
            gameType,
            variant,
            topology,
            baseModelId,
            rulesVersion,
            trainingSource,
            trainingDate: nowIso(),
            ratingEstimate,
            evaluationNotes,
            modelId: `${directory}${trainingSource}-${Date.now()}`
        });
        return this.modelStore.saveMetadata(metadata, {
            directory,
            modelData: {
                schema: 'topoboardgame.localRobotModel.v1',
                method: trainingSource,
                exampleCount: countExamples(examples),
                examplesDigest: countExamples(examples)
                    ? `${countExamples(examples)}:${JSON.stringify(examples[0]).length}:${JSON.stringify(examples.at(-1)).length}`
                    : '0',
                note: 'Open engines are teachers/baselines; this file describes a Topoboardgame local robot model for custom topology play.'
            }
        });
    }
}

export const defaultVariantTrainer = new VariantTrainer();
