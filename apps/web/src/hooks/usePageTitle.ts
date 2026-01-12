import { useEffect } from 'react';

const APP_NAME = 'Démonická';

export function usePageTitle(title?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${APP_NAME} | ${title}` : APP_NAME;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

export default usePageTitle;


