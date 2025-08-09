import { IconExternalLink } from '@tabler/icons-react';
import { ActionIcon, Anchor, Box, Card, Divider, Group, Stack, Text } from '@mantine/core';
import { EnglishSourceInfo } from '@/features/EnglishSourceInfo';
import {
  getLanguageName,
  languageCodes,
  type LanguageCode,
} from '@/features/language/languageCodes';
import { StatusBadge } from '@/features/StatusBadge';
import { type ArticleTranslation } from '@/features/translations';
import { formatDateISO } from '@/utils/date';

interface Props {
  articles: ArticleTranslation[];
  selectedLanguages: LanguageCode[];
}

export const MobileTranslationStatusMatrix = ({ articles, selectedLanguages }: Props) => {
  const sortedLangCodes = languageCodes.filter((code) => selectedLanguages.includes(code.value));

  if (articles.length === 0) {
    return (
      <Stack gap="md">
        <Card withBorder radius="md" p="lg" shadow="xs">
          <Text c="dimmed" ta="center">
            No articles found
          </Text>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {articles.map((article) => {
        const upToDateLangs = sortedLangCodes.filter(
          (code) => code.value !== 'en' && article.translations[code.value]?.status === 'up_to_date'
        );
        const outdatedLangs = sortedLangCodes.filter(
          (code) => code.value !== 'en' && article.translations[code.value]?.status === 'outdated'
        );
        const notTranslatedLangs = sortedLangCodes.filter(
          (code) =>
            code.value !== 'en' &&
            (!article.translations[code.value] ||
              article.translations[code.value]?.status === 'not_translated')
        );

        return (
          <Card key={article.englishPath} withBorder radius="md" p="sm" shadow="sm">
            {sortedLangCodes.length}
            <EnglishSourceInfo article={article} />
            <Divider my="md" />
            {sortedLangCodes.length === 1 ? (
              <Text c="dimmed" size="sm">
                Select target languages to view translation status
              </Text>
            ) : (
              <Stack gap="md">
                {/* Up to date languages */}
                {upToDateLangs.length > 0 && (
                  <Stack gap="xs">
                    {upToDateLangs.map((code) => {
                      const translation = article.translations[code.value];
                      const translationPath = article.englishPath.replace(
                        '/en/',
                        `/${code.value}/`
                      );

                      return (
                        <Box
                          key={code.value}
                          p="xs"
                          bg="rgba(34, 139, 34, 0.05)"
                          style={{
                            borderLeft: '4px solid #10b981',
                            borderRadius: 4,
                          }}
                        >
                          <Group justify="space-between" align="center">
                            <Group gap="xs" align="center">
                              <StatusBadge status="up_to_date" />
                              <Anchor
                                href={`https://github.com/kubernetes/website/blob/main/${translationPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                                c="inherit"
                              >
                                <Text fw={600} c="dark" size="sm">
                                  {getLanguageName(code.value)}
                                </Text>
                              </Anchor>
                              <Text size="xs" c="dimmed">
                                Updated at{' '}
                                {translation?.targetLatestDate
                                  ? formatDateISO(translation.targetLatestDate)
                                  : ''}
                              </Text>
                              {translation?.translationUrl && (
                                <ActionIcon
                                  component="a"
                                  href={translation.translationUrl || ''}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="xs"
                                  radius="xs"
                                  c="gray"
                                  variant="subtle"
                                  title="View on Kubernetes site"
                                >
                                  <IconExternalLink size={14} />
                                </ActionIcon>
                              )}
                            </Group>
                          </Group>
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {/* Outdated languages */}
                {outdatedLangs.length > 0 && (
                  <Stack gap="xs">
                    {outdatedLangs.map((code) => {
                      const translation = article.translations[code.value];
                      const translationPath = article.englishPath.replace(
                        '/en/',
                        `/${code.value}/`
                      );
                      return (
                        <Box
                          key={code.value}
                          p="xs"
                          bg="rgba(255, 165, 0, 0.1)"
                          style={{
                            borderLeft: '4px solid #f59e0b',
                            borderRadius: 4,
                          }}
                        >
                          <Stack gap={4}>
                            <Group justify="space-between" align="center">
                              <Group gap="xs">
                                <StatusBadge status="outdated" />
                                <Anchor
                                  href={`https://github.com/kubernetes/website/blob/main/${translationPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="hover"
                                  c="inherit"
                                >
                                  <Text fw={600} c="dark" size="sm">
                                    {getLanguageName(code.value)}
                                  </Text>
                                </Anchor>
                                <Text size="xs" c="dimmed">
                                  Updated at{' '}
                                  {translation?.targetLatestDate
                                    ? formatDateISO(translation.targetLatestDate)
                                    : ''}
                                </Text>
                                {translation?.translationUrl && (
                                  <ActionIcon
                                    component="a"
                                    href={translation.translationUrl || ''}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="xs"
                                    radius="xs"
                                    c="gray"
                                    variant="subtle"
                                    title="View on Kubernetes site"
                                  >
                                    <IconExternalLink size={14} />
                                  </ActionIcon>
                                )}
                              </Group>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {[
                                translation?.totalChangeLines &&
                                  `${translation.totalChangeLines} lines changed`,
                                translation?.commitsBehind &&
                                  translation?.daysBehind &&
                                  `${translation.commitsBehind} commits`,
                                translation?.daysBehind && `${translation.daysBehind} days behind`,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </Text>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {/* Not translated languages */}
                {notTranslatedLangs.length > 0 && (
                  <Box
                    p="md"
                    bg="#f8fafc"
                    style={{
                      borderRadius: 4,
                      borderLeft: '4px solid #cbd5e1',
                    }}
                  >
                    <Group gap="xs" mb="xs">
                      <Text size="xs" fw={600} c="dimmed">
                        — Not translated
                      </Text>
                    </Group>
                    <Group gap="xs">
                      {notTranslatedLangs.map((code) => (
                        <Box
                          key={code.value}
                          px="xs"
                          py={4}
                          bg="white"
                          style={{
                            borderRadius: 16,
                            fontSize: 11,
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            fontWeight: 500,
                          }}
                        >
                          {getLanguageName(code.value)}
                        </Box>
                      ))}
                    </Group>
                  </Box>
                )}
              </Stack>
            )}
          </Card>
        );
      })}
    </Stack>
  );
};
