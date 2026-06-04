import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Model } from '../types';

export const useUpdateModel = () => {
  const { patchData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Model, Error, { id: string; data: Partial<Model> }>({
    mutationFn: ({ id, data }) =>
      patchData(API_ROUTES.MODEL_BY_ID(id), data) as Promise<Model>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
