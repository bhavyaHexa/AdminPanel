import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { LoginResponse } from '../types';

export const useRefresh = () => {
  const { postData } = useAxios();

  return useMutation<LoginResponse, Error, void>({
    mutationFn: () =>
      postData(API_ROUTES.REFRESH_TOKENS) as Promise<LoginResponse>,
  });
};

export default useRefresh;
