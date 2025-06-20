// import { useMemo, useState } from 'react';
// import { Language } from '../languages';
// import { type TranslationState } from '../translation';

// type TranslationStatus = 'all' | 'translated' | 'untranslated';

// function filterTranslations(
//   data: TranslationState,
//   language: Language | null,
//   status: TranslationStatus
// ): TranslationState {
//   if (!language && status === 'all') {
//     return data;
//   }

//   return Object.entries(data).reduce((filtered, [filePath, fileData]) => {
//     if (shouldIncludeFile(fileData, language, status)) {
//       filtered[filePath] = fileData;
//     }
//     return filtered;
//   }, {} as TranslationState);
// }

// function shouldIncludeFile(
//   fileData: { langs: Language[] },
//   language: Language | null,
//   status: TranslationStatus
// ): boolean {
//   if (!language) {
//     return checkStatusOnly(fileData, status);
//   }

//   const hasLanguage = fileData.langs.includes(language);

//   switch (status) {
//     case 'all':
//       return true;
//     case 'translated':
//       return hasLanguage;
//     case 'untranslated':
//       return !hasLanguage;
//     default:
//       return true;
//   }
// }

// function checkStatusOnly(fileData: { langs: Language[] }, status: TranslationStatus): boolean {
//   const hasEnglish = fileData.langs.includes('en');

//   switch (status) {
//     case 'all':
//       return true;
//     case 'translated':
//       return hasEnglish;
//     case 'untranslated':
//       return !hasEnglish;
//     default:
//       return true;
//   }
// }

// export function useTranslationFilter(translationData: TranslationState) {
//   const [selectedLanguage, setSelectedLanguage] = useState<Language | null>('en');
//   const [translationStatus, setTranslationStatus] = useState<TranslationStatus>('all');

//   const filteredTranslations = useMemo(() => {
//     if (Object.keys(translationData).length === 0) {
//       return {};
//     }

//     return filterTranslations(translationData, selectedLanguage, translationStatus);
//   }, [translationData, selectedLanguage, translationStatus]);

//   return {
//     selectedLanguage,
//     setSelectedLanguage,
//     translationStatus,
//     setTranslationStatus,
//     filteredTranslations,
//   };
// }
