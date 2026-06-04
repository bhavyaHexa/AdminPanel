import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Color } from '../types';

export const useCreateColor = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Color, Error, Partial<Color>>({
    mutationFn: (data) =>
      postData(API_ROUTES.COLORS, data) as Promise<Color>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};

const usePostColors = useCreateColor;
export default usePostColors;
