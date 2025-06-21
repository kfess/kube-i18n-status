export type TranslationStatus = 'up_to_date' | 'outdated' | 'not_translated';

type Severity = 'current' | 'minor' | 'moderate' | 'significant' | 'critical';

export const languageCodes = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh-cn', label: 'Chinese' },
  { value: 'bn', label: 'Bengali' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'hi', label: 'Hindi' },
  { value: 'id', label: 'Indonesian' },
  { value: 'it', label: 'Italian' },
  { value: 'ko', label: 'Korean' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt-br', label: 'Portuguese (Brazil)' },
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'vi', label: 'Vietnamese' },
];

export type LanguageCode = (typeof languageCodes)[number]['value'];

interface TranslationInfo {
  status: TranslationStatus;
  severity: Severity;
  daysBehind: number;
  commitsBehind: number;
  totalChangeLines: number;
  targetLatestDate: string | null;
  englishLatestDate: string;
  translationUrl: string | null;
}

export interface ArticleTranslation {
  englishPath: string;
  englishUrl: string | null;
  translations: Record<LanguageCode, TranslationInfo>;
}

export interface TranslationStatusReport {
  lastUpdated: string;
  articles: ArticleTranslation[];
}

export const articleCategories = [
  { value: 'docsConcept', label: 'Docs / Concept' },
  { value: 'docsTask', label: 'Docs / Task' },
  { value: 'docsSetup', label: 'Docs / Setup' },
  { value: 'docsReference', label: 'Docs / Reference' },
  { value: 'docsTutorial', label: 'Docs / Tutorial' },
  { value: 'docsContribute', label: 'Docs / Contribution' },
  { value: 'blog', label: 'Blog' },
  { value: 'community', label: 'Community' },
  { value: 'caseStudy', label: 'Case Study' },
  { value: 'examples', label: 'Examples' },
  { value: 'includes', label: 'Includes' },
  { value: 'release', label: 'Release' },
  { value: 'partner', label: 'Partner' },
  { value: 'training', label: 'Training' },
] as const;

export type ArticleCategory = (typeof articleCategories)[number]['value'];
