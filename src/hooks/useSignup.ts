import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';
import type { SignupPayload } from '../types';

export const useSignup = () => {
  const { postData } = useAxios();

  return useMutation<{ message?: string }, Error, SignupPayload>({
    mutationFn: (data) =>
      postData(API_ROUTES.SIGNUP, data) as Promise<{ message?: string }>,
  });
};

export default useSignup;
