import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "../api/apiRoutes";
import useAxios from "../api/useAxios";
import { QUERY_KEYS } from "../common/queryKeys";
import type { Collection } from "../types";
export const useUpdateCollection = () => {
  const { patchData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<
    Collection,
    Error,
    { id: string; data: Partial<Collection> }
  >({
    mutationFn: ({ id, data }) =>
      patchData(API_ROUTES.COLLECTION_BY_ID(id), data) as Promise<Collection>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
