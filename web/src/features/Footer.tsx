import { Anchor, Box, Container, Group, Text } from '@mantine/core';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer">
      <Container>
        <Group py={40} justify="center">
          <Text c="dimmed" size="xs">
            {currentYear} Kubernetes i18n Tracker
          </Text>
          <Text c="dimmed" size="xs">
            •
          </Text>
          <Anchor
            href="https://github.com/kfess/kubernetes-i18n-tracker"
            target="_blank"
            rel="noopener noreferrer"
            c="dimmed"
            size="xs"
          >
            GitHub
          </Anchor>
          <Text c="dimmed" size="xs">
            •
          </Text>
          <Anchor
            href="https://github.com/kfess/kubernetes-i18n-tracker/issues"
            target="_blank"
            rel="noopener noreferrer"
            c="dimmed"
            size="xs"
          >
            Contact
          </Anchor>
        </Group>
      </Container>
    </Box>
  );
};
