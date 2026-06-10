import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { ChangePasswordPayload } from '../types';

export const useChangePassword = () => {
  const { postData } = useAxios();

  return useMutation<{ message?: string }, Error, ChangePasswordPayload>({
    mutationFn: (data) =>
      postData(API_ROUTES.CHANGE_PASSWORD, data) as Promise<{ message?: string }>,
  });
};

export default useChangePassword;
