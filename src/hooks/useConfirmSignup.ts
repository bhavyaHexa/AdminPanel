import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { ConfirmSignupPayload } from '../types';

export const useConfirmSignup = () => {
  const { postData } = useAxios();

  return useMutation<{ message?: string }, Error, ConfirmSignupPayload>({
    mutationFn: (data) =>
      postData(API_ROUTES.CONFIRM_SIGNUP, data) as Promise<{ message?: string }>,
  });
};

export default useConfirmSignup;
