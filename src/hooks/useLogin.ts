import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { LoginPayload, LoginResponse } from '../types';

export const useLogin = () => {
  const { postData } = useAxios();

  return useMutation<LoginResponse, Error, LoginPayload>({
    mutationFn: (data) =>
      postData(API_ROUTES.LOGIN, data) as Promise<LoginResponse>,
  });
};

export default useLogin;
