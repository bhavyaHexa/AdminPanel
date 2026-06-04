import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Color } from '../types';

export const useUpdateColor = () => {
  const { patchData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Color, Error, { id: string; data: Partial<Color> }>({
    mutationFn: ({ id, data }) =>
      patchData(API_ROUTES.COLOR_BY_ID(id), data) as Promise<Color>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
