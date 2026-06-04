import { useQuery } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Model } from '../types';

const useGetAllModels = () => {
  const { getData } = useAxios();

  return useQuery<Model[], Error>({
    queryFn: () =>
      getData(API_ROUTES.GET_ALL_MODELS) as Promise<Model[]>,
    queryKey: [QUERY_KEYS.ALL_MODELS],
  });
};

export default useGetAllModels;
