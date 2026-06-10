import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { ResendCodePayload } from '../types';

export const useResendCode = () => {
  const { postData } = useAxios();

  return useMutation<{ message?: string }, Error, ResendCodePayload>({
    mutationFn: (data) =>
      postData(API_ROUTES.RESEND_CODE, data) as Promise<{ message?: string }>,
  });
};

export default useResendCode;
