import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'Agent Template UI';

const routeTitles = [
  { path: '/login', title: '登录' },
  { path: '/chat', title: '对话' },
];

export default function RouteTitle() {
  const location = useLocation();

  useEffect(() => {
    const matched = routeTitles.find(item =>
      matchPath({ path: item.path, end: true }, location.pathname),
    );

    document.title = matched ? `${matched.title} - ${DEFAULT_TITLE}` : DEFAULT_TITLE;
  }, [location.pathname]);

  return null;
}
