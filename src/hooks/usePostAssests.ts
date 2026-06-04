import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Asset3D } from '../types';

export const useCreateAsset3D = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Asset3D, Error, Partial<Asset3D>>({
    mutationFn: (data) =>
      postData(API_ROUTES.ASSETS_3D, data) as Promise<Asset3D>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_ASSETS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};

const usePostAssests = useCreateAsset3D;
export default usePostAssests;
