import { useQuery } from '@tanstack/react-query';

import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { Collection } from '../types';

const useGetAllCollections = () => {
  const { getData } = useAxios();

  return useQuery<Collection[], Error>({
    queryFn: () =>
      getData(API_ROUTES.GET_ALL_COLLECTIONS) as Promise<Collection[]>,
    queryKey: [QUERY_KEYS.ALL_COLLECTIONS],
  });
};

export default useGetAllCollections;
