import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { ForgotPasswordPayload } from '../types';

export const useForgotPassword = () => {
  const { postData } = useAxios();

  return useMutation<{ message?: string }, Error, ForgotPasswordPayload>({
    mutationFn: (data) =>
      postData(API_ROUTES.FORGOT_PASSWORD, data) as Promise<{ message?: string }>,
  });
};

export default useForgotPassword;
