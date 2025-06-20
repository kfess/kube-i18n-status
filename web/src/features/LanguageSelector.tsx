import { IconCheck, IconTrash, IconWorld } from '@tabler/icons-react';
import { ActionIcon, Divider, Group, Menu, Text, Tooltip } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { languageCodes, type LanguageCode } from './translations';

export function LanguageSelector() {
  const [preferredLanguage, setPreferredLanguage] = useLocalStorage<LanguageCode | null>({
    key: 'preferred-language',
    defaultValue: 'en',
  });

  const handleLanguageSelect = (lang: LanguageCode) => {
    setPreferredLanguage(lang === preferredLanguage ? 'en' : lang);
  };

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Tooltip label="Preferred Language" position="bottom" withArrow offset={10}>
          <ActionIcon variant="default" radius="md" size="lg">
            <IconWorld size={20} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Select Preferred Language</Menu.Label>
        {languageCodes.map((lang: { value: string; label: string }) => {
          return (
            <Menu.Item
              key={lang.value}
              onClick={() => handleLanguageSelect(lang.value as LanguageCode)}
              rightSection={preferredLanguage === lang.value ? <IconCheck size={16} /> : null}
            >
              <Group>
                <Text size="sm" fw={600}>
                  {lang.label}
                </Text>
                {lang.value === 'en' && (
                  <Text size="xs" c="dimmed">
                    (Default)
                  </Text>
                )}
              </Group>
            </Menu.Item>
          );
        })}
        <Divider my="xs" />
        {preferredLanguage && (
          <Menu.Item
            fw={700}
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={() => setPreferredLanguage(null)}
          >
            Clear Language
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
