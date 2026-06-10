import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { ConfirmForgotPasswordPayload } from '../types';

export const useConfirmForgotPassword = () => {
  const { postData } = useAxios();

  return useMutation<{ message?: string }, Error, ConfirmForgotPasswordPayload>({
    mutationFn: (data) =>
      postData(API_ROUTES.CONFIRM_FORGOT_PASSWORD, data) as Promise<{ message?: string }>,
  });
};

export default useConfirmForgotPassword;
