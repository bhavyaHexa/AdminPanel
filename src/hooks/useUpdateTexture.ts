import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Texture } from '../types';

export const useUpdateTexture = () => {
  const { patchData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Texture, Error, { id: string; data: Partial<Texture> }>({
    mutationFn: ({ id, data }) =>
      patchData(API_ROUTES.TEXTURE_BY_ID(id), data) as Promise<Texture>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_TEXTURES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
