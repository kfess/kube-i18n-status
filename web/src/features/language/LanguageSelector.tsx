import { IconCheck, IconTrash, IconWorld } from '@tabler/icons-react';
import { ActionIcon, Divider, Group, Menu, Text, Tooltip } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import {
  browserLanguageMap,
  languageCodes,
  type LanguageCode,
} from '@/features/language/languageCodes';

const detectBrowserLanguage = (): LanguageCode => {
  const browserLanguages = navigator.languages || [navigator.language];
  for (const browserLang of browserLanguages) {
    if (browserLanguageMap[browserLang]) {
      return browserLanguageMap[browserLang];
    }

    const baseLanguage = browserLang.split('-')[0];
    if (browserLanguageMap[baseLanguage]) {
      return browserLanguageMap[baseLanguage];
    }
  }

  return 'en';
};

export function LanguageSelector() {
  const [selectedLanguages, setSelectedLanguages] = useLocalStorage<LanguageCode[]>({
    key: 'selected-languages',
    defaultValue: ['en', detectBrowserLanguage()].filter(
      (lang, index, arr): lang is LanguageCode => arr.indexOf(lang) === index
    ),
  });

  const handleLanguageToggle = (lang: LanguageCode) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length > 1) {
          return prev.filter((l) => l !== lang);
        }
        return prev;
      }
      return [...prev, lang];
    });
  };

  const handleClearAll = () => {
    setSelectedLanguages(['en']);
  };

  const selectedCount = selectedLanguages.length;

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <Tooltip
          label={`${selectedCount} language${selectedCount > 1 ? 's' : ''} selected`}
          position="bottom"
          withArrow
          offset={10}
        >
          <ActionIcon variant="default" radius="md" size="lg" style={{ position: 'relative' }}>
            <IconWorld size={20} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>
          <Group justify="space-between" align="center">
            <Text>Select Languages</Text>
            <Text size="xs" c="dimmed">
              {selectedCount} selected
            </Text>
          </Group>
        </Menu.Label>

        {languageCodes.map((lang: { value: string; label: string }) => {
          const isSelected = selectedLanguages.includes(lang.value as LanguageCode);
          const isOnlySelected = selectedLanguages.length === 1 && isSelected;

          return (
            <Menu.Item
              key={lang.value}
              onClick={() => handleLanguageToggle(lang.value as LanguageCode)}
              rightSection={isSelected ? <IconCheck size={16} /> : null}
              style={{
                backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
                opacity: isOnlySelected ? 0.7 : 1,
              }}
              disabled={isOnlySelected}
            >
              <Group>
                <Text size="sm" fw={isSelected ? 600 : 400} c={isSelected ? 'blue' : undefined}>
                  {lang.label}
                </Text>
                {lang.value === 'en' && (
                  <Text size="xs" c="dimmed">
                    (Default)
                  </Text>
                )}
                {isOnlySelected && (
                  <Text size="xs" c="dimmed">
                    (Required)
                  </Text>
                )}
              </Group>
            </Menu.Item>
          );
        })}

        <Divider my="xs" />

        {selectedCount > 1 && (
          <Menu.Item
            fw={700}
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={handleClearAll}
          >
            Clear All (Keep English)
          </Menu.Item>
        )}

        <Menu.Item disabled style={{ cursor: 'default' }}>
          <Text size="xs" c="dimmed" ta="center">
            Click languages to toggle selection
          </Text>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
