import { IconClock, IconExternalLink, IconEye, IconUsers } from '@tabler/icons-react';
import { ActionIcon, Anchor, Badge, Group, rem, Stack, Text, Tooltip } from '@mantine/core';
import { formatDateISO, formatSecondsToMMSS } from '@/utils/date';
import { type ArticleTranslation } from './translations';

interface Props {
  article: ArticleTranslation;
}

export const EnglishSourceInfo = ({ article }: Props) => {
  return (
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
            {formatSecondsToMMSS(Math.round(article.translations.en.averageSessionDuration) || 0)}
          </Badge>
        </Tooltip>
      </Group>
    </Stack>
  );
};
