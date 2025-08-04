import { useMemo, useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { ArticleCategorySelector } from '@/features/ArticleCategorySelector';
import { ArticleListControl } from '@/features/ArticleListControl';
import { useFetchTranslationArticles } from '@/features/hooks/useFetchTranslationArticles';
import { type LanguageCode, type LanguageCodeWithAll } from '@/features/language/languageCodes';
import { type ArticleCategory, type TranslationStatus } from '@/features/translations';
import { TranslationStatusMatrix } from '@/features/TranslationStatusMatrix';
import { type SortDirection, type SortMode } from '@/features/types';

export function HomePage() {
  const [selectedArticleCategory, setSelectedArticleCategory] =
    useState<ArticleCategory>('docsConcept');
  const translationArticles = useFetchTranslationArticles(selectedArticleCategory);

  // Pagination state
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState('30');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TranslationStatus | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<LanguageCodeWithAll>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  // Sort states
  const [sortMode, setSortMode] = useState<SortMode>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Selected languages from localStorage
  const [selectedLanguages] = useLocalStorage<LanguageCode[]>({
    key: 'selected-languages',
  });

  const getFilteredArticles = () => {
    let filtered = translationArticles;

    if (sortMode === 'views') {
      filtered = [...filtered].sort((a, b) => {
        const aViews = a.translations.en.views || 0;
        const bViews = b.translations.en.views || 0;
        return sortDirection === 'asc' ? aViews - bViews : bViews - aViews;
      });
    } else if (sortMode === 'newUsers') {
      filtered = [...filtered].sort((a, b) => {
        const aUsers = a.translations.en.newUsers || 0;
        const bUsers = b.translations.en.newUsers || 0;
        return sortDirection === 'asc' ? aUsers - bUsers : bUsers - aUsers;
      });
    } else if (sortMode === 'updatedAt') {
      filtered = [...filtered].sort((a, b) => {
        const aDate = new Date(a.translations.en.englishLatestDate);
        const bDate = new Date(b.translations.en.englishLatestDate);
        return sortDirection === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      });
    } else if (sortMode === 'averageSessionDuration') {
      filtered = [...filtered].sort((a, b) => {
        const aDuration = a.translations.en.averageSessionDuration || 0;
        const bDuration = b.translations.en.averageSessionDuration || 0;
        return sortDirection === 'asc' ? aDuration - bDuration : bDuration - aDuration;
      });
    } else {
      // eslint-disable-next-line no-lonely-if
      if (sortDirection === 'asc') {
        filtered = [...filtered].reverse();
      }
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((article) => {
        if (languageFilter === 'all') {
          return Object.values(article.translations).some(
            (translation) => translation.status === statusFilter
          );
        }

        const translation = article.translations[languageFilter];
        return translation && translation.status === statusFilter;
      });
    }

    if (languageFilter !== 'all' && statusFilter === 'all') {
      filtered = filtered.filter((article) => {
        const translation = article.translations[languageFilter];
        return translation !== undefined;
      });
    }

    if (debouncedSearchQuery) {
      const lowerQuery = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((article) =>
        article.englishPath.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  };

  const filteredArticles = useMemo(
    () => getFilteredArticles(),
    [
      translationArticles,
      statusFilter,
      languageFilter,
      debouncedSearchQuery,
      sortMode,
      sortDirection,
    ]
  );

  const startIndex = (activePage - 1) * parseInt(itemsPerPage, 10);
  const endIndex = Math.min(startIndex + parseInt(itemsPerPage, 10), filteredArticles.length);
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  const onArticleCategoryChange = (category: ArticleCategory) => {
    setSelectedArticleCategory(category);
    setActivePage(1);
  };

  return (
    <Container fluid px={{ base: 'xs', sm: 'md' }} mt={{ base: 'xs', sm: 'md' }}>
      <Stack gap="sm">
        <ArticleCategorySelector
          articleCategory={selectedArticleCategory}
          onArticleCategoryChange={onArticleCategoryChange}
        />
        <ArticleListControl
          articles={translationArticles}
          filteredArticles={filteredArticles}
          activePage={activePage}
          setActivePage={setActivePage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          languageFilter={languageFilter}
          setLanguageFilter={setLanguageFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          debouncedSearchQuery={debouncedSearchQuery}
          setDebouncedSearchQuery={setDebouncedSearchQuery}
          sortMode={sortMode}
          setSortMode={setSortMode}
          sortDirection={sortDirection}
          setSortDirection={setSortDirection}
          selectedLanguages={selectedLanguages || []}
          startIndex={startIndex}
          endIndex={endIndex}
        />
        <TranslationStatusMatrix
          articles={currentArticles}
          languageFilter={languageFilter}
          selectedLanguages={selectedLanguages || []}
        />
      </Stack>
    </Container>
  );
}
