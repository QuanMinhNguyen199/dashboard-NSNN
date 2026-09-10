import { useCallback, useEffect, useState } from 'react';
import { overviewProvider } from './providers';
import type { OverviewData, OverviewFilters, Resource } from './types';

export function useOverview(filters: OverviewFilters) {
  const [nonce, setNonce] = useState(0);
  const [resource, setResource] = useState<Resource<OverviewData>>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    setResource({ status: 'loading' });
    overviewProvider.getOverview(filters, controller.signal).then(data => {
      if (!data) setResource({ status: 'empty' });
      else setResource(data.meta.covered < data.meta.total ? { status: 'partial', data } : { status: 'ready', data });
    }).catch(error => {
      if ((error as Error).name !== 'AbortError') setResource({ status: 'error', message: 'Không tải được dữ liệu tổng quan.' });
    });
    return () => controller.abort();
  }, [filters, nonce]);
  return { resource, retry: useCallback(() => setNonce(n => n + 1), []) };
}
