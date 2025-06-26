import { useState } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Box,
  Card,
  Group,
  Pagination,
  rem,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedCallback, useLocalStorage } from '@mantine/hooks';
import { languageCodes, type LanguageCode } from '@/features/language/languageCodes';
import { ArticleTranslation, TranslationStatus } from '@/features/translations';

const getSortedLangCodes = (
  preferredLang?: LanguageCode
): { value: LanguageCode; label: string }[] => {
  const head = ['en'];
  if (preferredLang && preferredLang !== 'en') {
    head.push(preferredLang);
  }
  const rest = languageCodes.filter((l) => !head.includes(l.value));
  return [...head.map((code) => languageCodes.find((l) => l.value === code)!), ...rest];
};

const formatDateISO = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const StatusBadge = ({ status }: { status: TranslationStatus }) => {
  const getStatusConfig = (status: TranslationStatus) => {
    switch (status) {
      case 'up_to_date':
        return { emoji: '✅', label: 'Up to date' };
      case 'outdated':
        return { emoji: '⚠️', label: 'Outdated' };
      case 'not_translated':
        return { emoji: '—', label: 'Not translated' };
      default:
        return { emoji: '-', label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(status);

  return <span title={statusConfig.label}>{statusConfig.emoji}</span>;
};

const TranslationCell = ({
  article,
  langCode,
}: {
  article: ArticleTranslation;
  langCode: LanguageCode;
}) => {
  const { status, daysBehind, totalChangeLines, commitsBehind, targetLatestDate } =
    article.translations[langCode];
  const translationPath = article.englishPath.replace('/en/', `/${langCode}/`);

  const bgColor =
    status === 'up_to_date'
      ? 'rgba(34, 139, 34, 0.05)'
      : status === 'outdated'
        ? 'rgba(255, 165, 0, 0.1)'
        : '';

  return (
    <Table.Td
      style={{
        textAlign: 'center',
        whiteSpace: 'nowrap',
        backgroundColor: bgColor,
        minWidth: rem(200),
      }}
    >
      <>
        {status !== 'not_translated' ? (
          <Anchor
            href={`https://github.com/kubernetes/website/blob/main/${translationPath}`}
            target="_blank"
            rel="noopener noreferrer"
            underline="never"
            title={`Edit ${langCode} translation on GitHub`}
          >
            <StatusBadge status={status} />
          </Anchor>
        ) : (
          <StatusBadge status={status} />
        )}
      </>
      {totalChangeLines > 0 && status === 'outdated' && (
        <Text size="sm">{totalChangeLines.toLocaleString()} lines changed</Text>
      )}
      {status === 'outdated' && daysBehind && (
        <Text size="xs" c="dimmed">
          {commitsBehind.toLocaleString()} commit{commitsBehind > 1 ? 's' : ''} /{' '}
          {daysBehind.toLocaleString()} day
          {daysBehind !== 1 ? 's' : ''} behind
        </Text>
      )}
      {(status === 'outdated' || status === 'up_to_date') && targetLatestDate && (
        <Group gap="2" justify="center" align="center">
          <Text size="xs" c="dimmed">
            Updated at {formatDateISO(targetLatestDate)}
          </Text>
          {article.translations[langCode].translationUrl && (
            <ActionIcon
              component="a"
              href={article.translations[langCode].translationUrl || ''}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              radius="xs"
              c="gray"
              variant="subtle"
              title="Kubernetes documentation"
            >
              <IconExternalLink size={14} />
            </ActionIcon>
          )}
        </Group>
      )}
    </Table.Td>
  );
};

interface Props {
  articles: ArticleTranslation[];
  activePage: number;
  setActivePage: (page: number) => void;
}

interface Props {
  articles: ArticleTranslation[];
  activePage: number;
  setActivePage: (page: number) => void;
}

export const TranslationStatusMatrix = ({ articles, activePage, setActivePage }: Props) => {
  const [itemsPerPage, setItemsPerPage] = useState('30');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<LanguageCode | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  const [preferredLang, _] = useLocalStorage<LanguageCode>({
    key: 'preferred-language',
  });
  const sortedLangCodes = getSortedLangCodes(preferredLang);

  const debouncedSearch = useDebouncedCallback((query: string) => {
    setDebouncedSearchQuery(query);
    setActivePage(1);
  }, 500);

  const getFilteredArticles = () => {
    let filtered = articles;

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

  const filteredArticles = getFilteredArticles();
  const startIndex = (activePage - 1) * parseInt(itemsPerPage, 10);
  const endIndex = Math.min(startIndex + parseInt(itemsPerPage, 10), filteredArticles.length);
  const totalPages = Math.ceil(filteredArticles.length / parseInt(itemsPerPage, 10));
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'up_to_date', label: '✅ Up to date' },
    { value: 'outdated', label: '⚠️ Outdated' },
    { value: 'not_translated', label: '— Not translated' },
  ];

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    ...sortedLangCodes
      .filter((code) => code.value !== 'en')
      .map((code) => ({ value: code.value, label: code.label })),
  ];

  return (
    <Stack gap="sm">
      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          {/* Filter Controls */}
          <Group gap="md" wrap="wrap">
            <Select
              label="Status"
              c="dimmed"
              size="sm"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value || 'all');
                setActivePage(1);
              }}
              data={statusOptions}
              w={180}
            />
            <Select
              label="Language"
              c="dimmed"
              size="sm"
              value={languageFilter}
              onChange={(value) => {
                setLanguageFilter((value || 'all') as LanguageCode);
                setActivePage(1);
              }}
              data={languageOptions}
              w={180}
            />
            <TextInput
              label="Search"
              c="dimmed"
              value={searchQuery}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchQuery(newValue);
                debouncedSearch(newValue);
              }}
              placeholder="Search by article path ..."
              style={{ flexGrow: 1 }}
              maw={rem(300)}
            />
          </Group>

          {/* Pagination Controls */}
          <Group justify="space-between" wrap="wrap">
            <Text size="sm" c="dimmed">
              Showing {startIndex + 1}-{endIndex} of {filteredArticles.length} articles
              {(statusFilter !== 'all' || languageFilter !== 'all' || debouncedSearchQuery) && (
                <Text span c="blue">
                  {' '}
                  (filtered from {articles.length} total)
                </Text>
              )}
            </Text>
            <Group gap="md">
              <Group gap="xs" align="center">
                <Text size="sm" c="dimmed">
                  Items per page:
                </Text>
                <Select
                  size="sm"
                  value={itemsPerPage}
                  onChange={(value) => {
                    setItemsPerPage(value as string);
                    setActivePage(1);
                  }}
                  data={['30', '50', '100']}
                  w={80}
                />
              </Group>
              <Pagination
                value={activePage}
                onChange={setActivePage}
                total={totalPages}
                size="sm"
                withEdges
                radius="xs"
              />
            </Group>
          </Group>
        </Stack>
      </Card>

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
                    <Stack gap={4}>
                      <Anchor
                        href={`https://github.com/kubernetes/website/blob/main/${article.englishPath}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        c="inherit"
                      >
                        <Text
                          size="sm"
                          fw={500}
                          title={article.englishPath}
                          style={{
                            maxWidth: rem(250),
                            whiteSpace: 'normal',
                            overflowWrap: 'break-word',
                            wordBreak: 'keep-all',
                          }}
                        >
                          {article.englishPath.replace('content/en/', '')}
                        </Text>
                      </Anchor>
                      <Group gap="3" align="center" wrap="nowrap" c="dimmed">
                        <Text size="xs">
                          Updated at {formatDateISO(article.translations.en?.englishLatestDate)}
                        </Text>
                        {article.englishUrl && (
                          <ActionIcon
                            component="a"
                            href={article.englishUrl || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="xs"
                            radius="xs"
                            variant="subtle"
                            color="gray"
                            title="View on Kubernetes site"
                          >
                            <IconExternalLink size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Stack>
                  </Table.Td>
                  {sortedLangCodes.map((code) => (
                    <TranslationCell key={code.value} article={article} langCode={code.value} />
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
