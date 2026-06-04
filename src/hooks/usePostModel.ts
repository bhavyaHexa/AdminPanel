import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Model } from '../types';

export const useCreateModel = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Model, Error, Partial<Model>>({
    mutationFn: (data) =>
      postData(API_ROUTES.MODELS, data) as Promise<Model>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};

const usePostModel = useCreateModel;
export default usePostModel;
