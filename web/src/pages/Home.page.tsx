import { useState } from 'react';
import { Container, Divider } from '@mantine/core';
import { Welcome } from '@/components/Welcome/Welcome';

export function HomePage() {
  // const [selectedContentType, setSelectedContentType] = useState<ContentType>('docs');
  // const [selectedDocsSubType, setSelectedDocsSubType] = useState<DocsSubContentType>('concept');

  // const translationData = useFetchTranslationData(
  //   selectedContentType,
  //   selectedContentType === 'docs' ? selectedDocsSubType : undefined
  // );

  // const [activePage, setActivePage] = useState(1);

  // const handleContentTypeChange = (newType: ContentType) => {
  //   setSelectedContentType(newType);
  //   setActivePage(1);
  // };

  // const handleDocsSubTypeChange = (newSubType: DocsSubContentType) => {
  //   setSelectedDocsSubType(newSubType);
  //   setActivePage(1);
  // };

  return (
    <>
      <Welcome />
    </>
  );
}
