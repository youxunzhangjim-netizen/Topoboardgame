import type {
  LabHash,
  LabId,
  LabJSONValue,
  LabMetadata,
  LabTimestamp,
  LabValidationLevel
} from './types';

export type LabPublicationReadinessLevel =
  | 'exploratory'
  | 'reproducible'
  | 'benchmark_supported'
  | 'publication_supporting';

export type LabPublicationExportPurpose =
  | 'exploratory_sharing'
  | 'classroom_demonstration'
  | 'reproducibility_bundle'
  | 'supplementary_material'
  | 'dataset_release'
  | 'benchmark_report'
  | 'topology_comparison_report'
  | 'phase_regime_scan_report';

export type LabPublicationWarningSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface LabPublicationWarning {
  warningId: LabId;
  severity: LabPublicationWarningSeverity;
  affectedArtifact?: string;
  message: string;
  recommendation: string;
  canProceed: boolean;
}

export interface LabPublicationArtifactSelection {
  coreFiles: readonly string[];
  dataFiles: readonly string[];
  documentationFiles: readonly string[];
  citationFiles: readonly string[];
  visualFiles: readonly string[];
  auditFiles: readonly string[];
}

export interface LabFigureSpec {
  figureId: LabId;
  figureType: string;
  title: string;
  caption: string;
  sourceObjectId: LabId;
  sourceDataPath: string;
  selectedObservables: readonly LabId[];
  selectedTopologies: readonly LabId[];
  selectedSeeds: readonly string[];
  axisLabels: Record<string, string>;
  units: Record<string, string>;
  renderingOptions: LabMetadata;
  warnings: readonly LabPublicationWarning[];
  figureHash: LabHash;
}

export interface LabTableSpec {
  tableId: LabId;
  tableType: string;
  title: string;
  sourceObjectId: LabId;
  selectedColumns: readonly string[];
  units: Record<string, string>;
  definitions: Record<string, string>;
  aggregationMethod?: string;
  warnings: readonly LabPublicationWarning[];
  tableHash: LabHash;
}

export interface LabDataDictionaryFile {
  path: string;
  mediaType: string;
  description: string;
  fields: readonly string[];
  checksum?: LabHash;
}

export interface LabDataDictionaryField {
  fieldName: string;
  filePath?: string;
  dataType: string;
  definition: string;
  unit?: string;
  missingValue?: string;
  warnings?: readonly string[];
}

export interface LabDataDictionary {
  dictionaryId: LabId;
  datasetId: LabId;
  generatedAt: LabTimestamp;
  schemaVersion: string;
  files: readonly LabDataDictionaryFile[];
  fields: readonly LabDataDictionaryField[];
  observableDefinitions: readonly LabMetadata[];
  topologyDefinitions: readonly LabMetadata[];
  modelDefinitions: readonly LabMetadata[];
  units: Record<string, string>;
  categoricalValues: Record<string, readonly string[]>;
  missingValueConventions: readonly string[];
  warningDefinitions: readonly LabPublicationWarning[];
  limitations: readonly string[];
  dictionaryHash: LabHash;
}

export interface LabMethodsSummary {
  summaryId: LabId;
  sourceObjectId: LabId;
  generatedAt: LabTimestamp;
  modelSummary: string;
  topologySummary: string;
  ruleSummary: string;
  observableSummary: string;
  experimentSummary: string;
  validationSummary: string;
  limitations: readonly string[];
  editableMarkdown: string;
  summaryHash: LabHash;
}

export interface LabCitationCreator {
  name: string;
  affiliation?: string;
  orcid?: string;
}

export interface LabCitationMetadata {
  citationId: LabId;
  title: string;
  creators: readonly LabCitationCreator[];
  projectName: string;
  version: string;
  createdAt: LabTimestamp;
  exportedAt: LabTimestamp;
  objectType: string;
  modelIds: readonly LabId[];
  topologyIds: readonly LabId[];
  experimentHash?: LabHash;
  resultHash?: LabHash;
  validationReportHash?: LabHash;
  bundleHash?: LabHash;
  repositoryUrl?: string;
  projectUrl?: string;
  license: string;
  keywords: readonly string[];
  abstract: string;
  suggestedCitationText: string;
  bibtex: string;
  cslJson?: LabJSONValue;
}

export interface LabProvenanceTransformation {
  transformationId: LabId;
  inputIds: readonly LabId[];
  outputIds: readonly LabId[];
  method: string;
  parameters: LabMetadata;
  warnings: readonly LabPublicationWarning[];
  inputHashes: Record<LabId, LabHash>;
  outputHashes: Record<LabId, LabHash>;
}

export interface LabProvenanceRecord {
  provenanceId: LabId;
  sourceObjects: readonly LabId[];
  sourceHashes: Record<LabId, LabHash>;
  transformations: readonly LabProvenanceTransformation[];
  generatedArtifacts: readonly string[];
  softwareVersions: Record<string, string>;
  schemaVersions: Record<string, string>;
  rngMetadata: LabMetadata;
  validationReports: readonly LabId[];
  benchmarkReports: readonly LabId[];
  exportSettings: LabMetadata;
  createdAt: LabTimestamp;
  provenanceHash: LabHash;
}

export interface LabLicenseMetadata {
  licenseId: LabId;
  licenseName: string;
  licenseUrl?: string;
  licenseText?: string;
  selectedByUser: boolean;
  warnings: readonly LabPublicationWarning[];
}

export interface LabPublicationExportFile {
  path: string;
  mediaType: string;
  description: string;
  artifactCategory: string;
  checksum: LabHash;
  sizeBytes?: number;
}

export interface LabPublicationExportManifest {
  manifestId: LabId;
  bundleId: LabId;
  bundleName: string;
  exportPurpose: LabPublicationExportPurpose;
  createdAt: LabTimestamp;
  appVersion: string;
  schemaVersion: string;
  includedFiles: readonly LabPublicationExportFile[];
  fileChecksums: Record<string, LabHash>;
  sourceObjectHashes: Record<LabId, LabHash>;
  configHashes: readonly LabHash[];
  resultHashes: readonly LabHash[];
  validationReportHashes: readonly LabHash[];
  benchmarkReportHashes: readonly LabHash[];
  figureHashes: readonly LabHash[];
  tableHashes: readonly LabHash[];
  dataDictionaryHash: LabHash;
  methodsSummaryHash: LabHash;
  citationMetadataHash: LabHash;
  provenanceHash: LabHash;
  warnings: readonly LabPublicationWarning[];
  readinessLevel: LabPublicationReadinessLevel;
  manifestHash: LabHash;
}

export interface LabPublicationPackageConfig {
  packageId: LabId;
  packageName: string;
  exportPurpose: LabPublicationExportPurpose;
  sourceObjectIds: readonly LabId[];
  selectedArtifacts: LabPublicationArtifactSelection;
  figureSpecs: readonly LabFigureSpec[];
  tableSpecs: readonly LabTableSpec[];
  documentationOptions: LabMetadata;
  citationOptions: LabMetadata;
  licenseOptions: LabMetadata;
  readinessChecks: LabMetadata;
  appVersion: string;
  schemaVersion: string;
  createdAt: LabTimestamp;
  packageHash: LabHash;
}

export interface LabPublicationPackageResult {
  packageConfig: LabPublicationPackageConfig;
  generatedFiles: readonly LabPublicationExportFile[];
  figures: readonly LabFigureSpec[];
  tables: readonly LabTableSpec[];
  dataDictionary: LabDataDictionary;
  methodsSummary: LabMethodsSummary;
  citationMetadata: LabCitationMetadata;
  licenseMetadata: LabLicenseMetadata;
  provenanceRecord: LabProvenanceRecord;
  exportManifest: LabPublicationExportManifest;
  warnings: readonly LabPublicationWarning[];
  readinessLevel: LabPublicationReadinessLevel;
  packageResultHash: LabHash;
}

export interface LabPublicationSourceSummary {
  objectId: LabId;
  objectType: string;
  modelIds: readonly LabId[];
  topologyIds: readonly LabId[];
  topologyHashes: readonly LabHash[];
  localRuleIds: readonly LabId[];
  ruleHashes: readonly LabHash[];
  seedPlan?: LabJSONValue;
  stepCount?: number;
  observableIds: readonly LabId[];
  resultHash?: LabHash;
  validationLevel: LabValidationLevel | 'unknown';
  validationReportStatus?: string;
  reproducibilityStatus?: string;
  benchmarkStatus?: string;
  warnings: readonly LabPublicationWarning[];
  missingMetadata: readonly string[];
}
