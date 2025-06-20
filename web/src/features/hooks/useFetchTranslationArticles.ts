import blogArticles from '@/data/output/matrix/blog.json';
import caseStudiesArticles from '@/data/output/matrix/case-studies.json';
import communityArticles from '@/data/output/matrix/community.json';
import docsConceptsArticles from '@/data/output/matrix/docs_concepts.json';
import docsContributionArticles from '@/data/output/matrix/docs_contribute.json';
import docsReferenceArticles from '@/data/output/matrix/docs_reference.json';
import docsSetupArticles from '@/data/output/matrix/docs_setup.json';
import docsTasksArticles from '@/data/output/matrix/docs_tasks.json';
import docsTutorialsArticles from '@/data/output/matrix/docs_tutorials.json';
import examplesArticles from '@/data/output/matrix/examples.json';
import includesArticles from '@/data/output/matrix/includes.json';
import partnerArticles from '@/data/output/matrix/partners.json';
import releaseArticles from '@/data/output/matrix/releases.json';
import trainingArticles from '@/data/output/matrix/training.json';
import {
  ArticleCategory,
  ArticleTranslation,
  TranslationStatusReport,
} from '@/features/translations';

const articles = {
  blog: blogArticles,
  caseStudy: caseStudiesArticles,
  community: communityArticles,
  examples: examplesArticles,
  docsConcept: docsConceptsArticles,
  docsContribute: docsContributionArticles,
  docsTask: docsTasksArticles,
  docsReference: docsReferenceArticles,
  docsSetup: docsSetupArticles,
  docsTutorial: docsTutorialsArticles,
  includes: includesArticles,
  partner: partnerArticles,
  release: releaseArticles,
  training: trainingArticles,
} as Record<ArticleCategory, TranslationStatusReport>;

export const useFetchTranslationArticles = (
  articleCategory: ArticleCategory
): ArticleTranslation[] => {
  return articles[articleCategory].articles;
};
