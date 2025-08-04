import { Box, rem, Table, Text } from '@mantine/core';
import { EnglishSourceInfo } from '@/features/EnglishSourceInfo';
import {
  getSortedLangCodes,
  type LanguageCode,
  type LanguageCodeWithAll,
} from '@/features/language/languageCodes';
import { ArticleTranslation } from '@/features/translations';
import { TranslationStatusCell } from '@/features/TranslationStatusCell';

interface Props {
  articles: ArticleTranslation[];
  languageFilter: LanguageCodeWithAll;
  selectedLanguages: LanguageCode[];
}

export const TranslationStatusMatrix = ({ articles, languageFilter, selectedLanguages }: Props) => {
  const sortedLangCodes = getSortedLangCodes(selectedLanguages);

  return (
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
          {articles.length > 0 ? (
            articles.map((article) => (
              <Table.Tr key={article.englishPath}>
                <Table.Td>
                  <EnglishSourceInfo article={article} />
                </Table.Td>
                {sortedLangCodes.map((code) => (
                  <TranslationStatusCell key={code.value} article={article} langCode={code.value} />
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
  );
};
