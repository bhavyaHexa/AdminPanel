import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';

export const useUploadAsset3DGlb = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { widthId: string; formData: FormData }>({
    mutationFn: ({ widthId, formData }) =>
      postData(API_ROUTES.UPLOAD_ASSET_3D_GLB(widthId), formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_ASSETS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
