import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Texture } from '../types';

export const useCreateTexture = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Texture, Error, Partial<Texture>>({
    mutationFn: (data) =>
      postData(API_ROUTES.TEXTURES, data) as Promise<Texture>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_TEXTURES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_WIDTHS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLORS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_MODELS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};

const usePostTextures = useCreateTexture;
export default usePostTextures;
