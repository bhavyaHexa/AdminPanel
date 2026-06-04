import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';

export const useDeleteWidth = () => {
  const { deleteData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: (id) =>
      deleteData(API_ROUTES.WIDTHS, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
