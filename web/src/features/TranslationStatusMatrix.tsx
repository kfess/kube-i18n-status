import { useState } from 'react';
import {
  IconArrowsSort,
  IconCalendar,
  IconClock,
  IconExternalLink,
  IconEye,
  IconHome,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Card,
  Group,
  Menu,
  Pagination,
  rem,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDebouncedCallback, useLocalStorage } from '@mantine/hooks';
import { languageCodes, type LanguageCode } from '@/features/language/languageCodes';
import { ArticleTranslation, TranslationStatus } from '@/features/translations';
import { trackExternalLink } from '@/lib/google_analytics';

const getSortedLangCodes = (
  selectedLanguages?: LanguageCode[]
): { value: LanguageCode; label: string }[] => {
  const head = ['en'];

  if (selectedLanguages && Array.isArray(selectedLanguages)) {
    selectedLanguages.forEach((lang) => {
      if (lang !== 'en' && !head.includes(lang)) {
        head.push(lang);
      }
    });
  }
  const rest = languageCodes.filter((l) => !head.includes(l.value));
  return [...head.map((code) => languageCodes.find((l) => l.value === code)!), ...rest];
};

const formatDateISO = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const formatSecondsToMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            onClick={() => {
              trackExternalLink(
                `https://github.com/kubernetes/website/blob/main/${translationPath}`
              );
            }}
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
              onClick={() => {
                trackExternalLink(article.translations[langCode].translationUrl || '');
              }}
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

  const [selectedLanguages, _] = useLocalStorage<LanguageCode[]>({
    key: 'selected-languages',
  });
  const sortedLangCodes = getSortedLangCodes(selectedLanguages);

  const debouncedSearch = useDebouncedCallback((query: string) => {
    setDebouncedSearchQuery(query);
    setActivePage(1);
  }, 500);

  const [sortMode, setSortMode] = useState<
    'views' | 'newUsers' | 'updatedAt' | 'averageSessionDuration' | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  const resetFilters = () => {
    setStatusFilter('all');
    setLanguageFilter('all');
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSortMode(null);
    setSortDirection('desc');
    setActivePage(1);
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
          <Group gap="sm" wrap="wrap" align="end">
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
              placeholder="Search by Article Path ..."
              style={{ flexGrow: 1 }}
              maw={rem(300)}
            />
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon
                  variant="light"
                  size="lg"
                  title={`Sort by ${sortMode} (${sortDirection})`}
                >
                  <IconArrowsSort size={17} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Sort By</Menu.Label>
                <Menu.Item
                  leftSection={<IconHome size={14} />}
                  onClick={() => {
                    setSortMode(null);
                    setSortDirection(
                      sortMode === null ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc'
                    );
                  }}
                  rightSection={
                    sortMode === null &&
                    (sortDirection === 'desc' ? (
                      <IconSortDescending size={14} />
                    ) : (
                      <IconSortAscending size={14} />
                    ))
                  }
                  bg={sortMode === null ? 'var(--mantine-color-gray-1)' : undefined}
                >
                  Default
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconEye size={14} />}
                  onClick={() => {
                    setSortMode('views');
                    setSortDirection(
                      sortMode === 'views' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc'
                    );
                  }}
                  rightSection={
                    sortMode === 'views' &&
                    (sortDirection === 'desc' ? (
                      <IconSortDescending size={14} />
                    ) : (
                      <IconSortAscending size={14} />
                    ))
                  }
                  bg={sortMode === 'views' ? 'var(--mantine-color-gray-1)' : undefined}
                >
                  Views
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconUsers size={14} />}
                  onClick={() => {
                    setSortMode('newUsers');
                    setSortDirection(
                      sortMode === 'newUsers' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc'
                    );
                  }}
                  rightSection={
                    sortMode === 'newUsers' &&
                    (sortDirection === 'desc' ? (
                      <IconSortDescending size={14} />
                    ) : (
                      <IconSortAscending size={14} />
                    ))
                  }
                  bg={sortMode === 'newUsers' ? 'var(--mantine-color-gray-1)' : undefined}
                >
                  New Users
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconClock size={14} />}
                  onClick={() => {
                    setSortMode('averageSessionDuration');
                    setSortDirection(
                      sortMode === 'averageSessionDuration'
                        ? sortDirection === 'asc'
                          ? 'desc'
                          : 'asc'
                        : 'desc'
                    );
                  }}
                  rightSection={
                    sortMode === 'averageSessionDuration' &&
                    (sortDirection === 'desc' ? (
                      <IconSortDescending size={14} />
                    ) : (
                      <IconSortAscending size={14} />
                    ))
                  }
                  bg={
                    sortMode === 'averageSessionDuration'
                      ? 'var(--mantine-color-gray-1)'
                      : undefined
                  }
                >
                  Session Duration
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconCalendar size={14} />}
                  onClick={() => {
                    setSortMode('updatedAt');
                    setSortDirection(
                      sortMode === 'updatedAt' ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc'
                    );
                  }}
                  rightSection={
                    sortMode === 'updatedAt' &&
                    (sortDirection === 'desc' ? (
                      <IconSortDescending size={14} />
                    ) : (
                      <IconSortAscending size={14} />
                    ))
                  }
                  bg={sortMode === 'updatedAt' ? 'var(--mantine-color-gray-1)' : undefined}
                >
                  Updated At
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <ActionIcon
              variant="light"
              color="orange"
              size="lg"
              onClick={resetFilters}
              title="Reset filters"
            >
              <IconRefresh size={17} />
            </ActionIcon>
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
                        onClick={() => {
                          trackExternalLink(
                            `https://github.com/kubernetes/website/blob/main/${article.englishPath}`
                          );
                        }}
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
                            onClick={() => {
                              trackExternalLink(article.englishPath || '');
                            }}
                          >
                            <IconExternalLink size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                      <Group gap="xs" align="center">
                        <Tooltip label="Views" withArrow>
                          <Badge
                            variant="light"
                            color="blue"
                            leftSection={<IconEye size={12} />}
                            size="sm"
                            style={{ textTransform: 'none' }}
                          >
                            {article.translations.en.views.toLocaleString()}
                          </Badge>
                        </Tooltip>
                        <Tooltip label="New Users" withArrow>
                          <Badge
                            variant="light"
                            color="green"
                            leftSection={<IconUsers size={12} />}
                            size="sm"
                            style={{ textTransform: 'none' }}
                          >
                            {article.translations.en.newUsers.toLocaleString()}
                          </Badge>
                        </Tooltip>
                        <Tooltip label="Average Session Duration" withArrow>
                          <Badge
                            variant="light"
                            color="indigo"
                            leftSection={<IconClock size={12} />}
                            size="sm"
                            style={{ textTransform: 'none' }}
                          >
                            {formatSecondsToMMSS(
                              Math.round(article.translations.en.averageSessionDuration) || 0
                            )}
                          </Badge>
                        </Tooltip>
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
