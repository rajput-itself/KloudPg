import { useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
} from 'react-router-dom';

export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (url) => navigate(url),
    replace: (url) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    refresh: () => window.location.reload(),
    prefetch: async () => {},
  };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useSearchParams() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location.search]);
}

export function useParams() {
  return useRouterParams();
}
