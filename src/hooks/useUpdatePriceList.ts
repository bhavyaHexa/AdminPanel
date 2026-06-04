import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { PriceList } from '../types';

export const useUpdatePriceList = () => {
  const { patchData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<PriceList, Error, { id: string; data: Partial<PriceList> }>({
    mutationFn: ({ id, data }) =>
      patchData(API_ROUTES.PRICE_LIST_BY_ID(id), data) as Promise<PriceList>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_PRICES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
