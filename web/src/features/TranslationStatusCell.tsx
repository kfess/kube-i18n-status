import { IconExternalLink } from '@tabler/icons-react';
import { ActionIcon, Anchor, Group, rem, Table, Text } from '@mantine/core';
import { type LanguageCode } from '@/features/language/languageCodes';
import { ArticleTranslation, type TranslationStatus } from '@/features/translations';
import { formatDateISO } from '@/utils/date';

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
    </Table.Td>
  );
};
