export type KnowledgeDataType =
  | 'PGN'
  | 'SGF'
  | 'WTHOR'
  | 'JSON'
  | 'engine'
  | 'tablebase'
  | 'notes';

export type RedistributionStatus = 'allowed' | 'not_allowed' | 'unknown' | 'local_only';

export interface KnowledgeSource {
  sourceName: string;
  sourceUrl: string;
  licenseSummary: string;
  dataType: KnowledgeDataType;
  redistributionAllowed: RedistributionStatus;
  localPath?: string;
  notes?: string;
}

export interface KnowledgeManifest {
  schema: 'topoboardgame.ai.knowledge_manifest.v1';
  updatedAt: string;
  rules: string[];
  sources: KnowledgeSource[];
}

export function assertRedistributable(source: KnowledgeSource): void {
  if (source.redistributionAllowed !== 'allowed') {
    throw new Error(`Source "${source.sourceName}" is not marked redistributable.`);
  }
}

