import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { PriceList } from '../types';

export const useCreatePriceList = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<PriceList, Error, Partial<PriceList>>({
    mutationFn: (data) =>
      postData(API_ROUTES.PRICE_LISTS, data) as Promise<PriceList>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_PRICES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};

const usePostPrices = useCreatePriceList;
export default usePostPrices;
