import { useState } from 'react';
import { Container } from '@mantine/core';
import { ArticleCategorySelector } from '@/features/ArticleCategorySelector';
import { useFetchTranslationArticles } from '@/features/hooks/useFetchTranslationArticles';
import { ArticleCategory } from '@/features/translations';
import { TranslationStatusMatrix } from '@/features/TranslationStatusMatrix';

export function HomePage() {
  const [selectedArticleCategory, setSelectedArticleCategory] =
    useState<ArticleCategory>('docsConcept');
  const translationArticles = useFetchTranslationArticles(selectedArticleCategory);

  const [activePage, setActivePage] = useState(1);

  const onArticleCategoryChange = (category: ArticleCategory) => {
    setSelectedArticleCategory(category);
    setActivePage(1);
  };

  return (
    <Container size="xl" mt="md">
      <ArticleCategorySelector
        articleCategory={selectedArticleCategory}
        onArticleCategoryChange={onArticleCategoryChange}
      />
      <TranslationStatusMatrix
        activePage={activePage}
        setActivePage={setActivePage}
        articles={translationArticles}
      />
    </Container>
  );
}
