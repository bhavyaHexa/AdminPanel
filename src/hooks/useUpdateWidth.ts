import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Width } from '../types';

export const useUpdateWidth = () => {
  const { patchData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Width, Error, { id: string; data: Partial<Width> }>({
    mutationFn: ({ id, data }) =>
      patchData(API_ROUTES.WIDTH_BY_ID(id), data) as Promise<Width>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
