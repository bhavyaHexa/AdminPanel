import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';

export const useUploadTextureNoDiamondBase = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string; formData: FormData }>({
    mutationFn: ({ id, formData }) =>
      postData(API_ROUTES.UPLOAD_TEXTURE_NO_DIAMOND_BASE(id), formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_TEXTURES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
