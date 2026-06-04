import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "../api/apiRoutes";
import useAxios from "../api/useAxios";
import { QUERY_KEYS } from "../common/queryKeys";
import type { Collection } from "../types";

export const useCreateCollection = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<Collection, Error, Partial<Collection>>({
    mutationFn: (data) =>
      postData(API_ROUTES.COLLECTIONS, data) as Promise<Collection>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};

const usePostCollection = useCreateCollection;
export default usePostCollection;
