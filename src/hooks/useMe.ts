import { useQuery } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import { QUERY_KEYS } from '../common/queryKeys';
import type { User } from '../types';

export const useMe = (options?: { enabled?: boolean }) => {
  const { getData } = useAxios();

  return useQuery<User, Error>({
    queryFn: () => getData(API_ROUTES.ME) as Promise<User>,
    queryKey: [QUERY_KEYS.CURRENT_USER],
    ...options,
  });
};

export default useMe;
