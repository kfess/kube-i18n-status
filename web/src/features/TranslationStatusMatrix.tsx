import { useMemo, useState } from 'react';
import { Box, rem, Stack, Table, Text } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  getSortedLangCodes,
  type LanguageCode,
  type LanguageCodeWithAll,
} from '@/features/language/languageCodes';
import { ArticleTranslation, TranslationStatus } from '@/features/translations';
import { TranslationStatusCell } from '@/features/TranslationStatusCell';
import { ArticleListControl } from './ArticleListControl';
import { EnglishSourceInfo } from './EnglishSourceInfo';
import { type SortDirection, type SortMode } from './types';

interface Props {
  articles: ArticleTranslation[];
  activePage: number;
  setActivePage: (page: number) => void;
}

export const TranslationStatusMatrix = ({ articles, activePage, setActivePage }: Props) => {
  const [itemsPerPage, setItemsPerPage] = useState('30');
  const [statusFilter, setStatusFilter] = useState<TranslationStatus | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<LanguageCodeWithAll>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedLanguages] = useLocalStorage<LanguageCode[]>({
    key: 'selected-languages',
  });

  const getFilteredArticles = () => {
    let filtered = articles;

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
    [articles, statusFilter, languageFilter, debouncedSearchQuery, sortMode, sortDirection]
  );
  const sortedLangCodes = getSortedLangCodes(selectedLanguages);
  const startIndex = (activePage - 1) * parseInt(itemsPerPage, 10);
  const endIndex = Math.min(startIndex + parseInt(itemsPerPage, 10), filteredArticles.length);
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  return (
    <Stack gap="sm">
      <ArticleListControl
        articles={articles}
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
      <Box style={{ overflowX: 'auto' }}>
        <Table stickyHeader withTableBorder withColumnBorders verticalSpacing={5}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ minWidth: rem(300) }}>English Article</Table.Th>
              {sortedLangCodes.map((code) => (
                <Table.Th key={code.value} style={{ textAlign: 'center', minWidth: rem(120) }}>
                  {code.label}
                  {languageFilter === code.value && (
                    <Text span c="blue" size="xs">
                      {' '}
                      (filtered)
                    </Text>
                  )}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {currentArticles.length > 0 ? (
              currentArticles.map((article) => (
                <Table.Tr key={article.englishPath}>
                  <Table.Td>
                    <EnglishSourceInfo article={article} />
                  </Table.Td>
                  {sortedLangCodes.map((code) => (
                    <TranslationStatusCell
                      key={code.value}
                      article={article}
                      langCode={code.value}
                    />
                  ))}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td
                  colSpan={sortedLangCodes.length + 1}
                  style={{ textAlign: 'center', padding: '2rem' }}
                >
                  <Text c="dimmed">No articles match the selected filters</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Box>
    </Stack>
  );
};
