import { IconExternalLink } from '@tabler/icons-react';
import { ActionIcon, Anchor, Group, rem, Table, Text, Tooltip } from '@mantine/core';
import { type LanguageCode } from '@/features/language/languageCodes';
import { StatusBadge } from '@/features/StatusBadge';
import { type ArticleTranslation } from '@/features/translations';
import { formatDateISO } from '@/utils/date';

export const TranslationStatusCell = ({
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
      {article.translations[langCode].prs.length > 0 && (
        <Text size="xs" c="dimmed">
          PR:{' '}
          {article.translations[langCode].prs.map((pr) => (
            <Tooltip key={pr.number} label={`PR #${pr.number} - ${pr.title}`}>
              <Text key={pr.number} size="xs" c="dimmed" component="span">
                <Anchor href={`${pr.url}`} target="_blank" rel="noopener noreferrer">
                  #{pr.number}{' '}
                </Anchor>
              </Text>
            </Tooltip>
          ))}
        </Text>
      )}
    </Table.Td>
  );
};
