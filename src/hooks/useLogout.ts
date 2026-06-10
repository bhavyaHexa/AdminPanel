import { useMutation } from '@tanstack/react-query';
import { API_ROUTES } from '../api/apiRoutes';
import useAxios from '../api/useAxios';

export const useLogout = () => {
  const { postData } = useAxios();

  return useMutation<{ message?: string }, Error, void>({
    mutationFn: () =>
      postData(API_ROUTES.LOGOUT) as Promise<{ message?: string }>,
  });
};

export default useLogout;
