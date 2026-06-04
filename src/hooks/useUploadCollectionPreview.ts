import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ROUTES } from "../api/apiRoutes";
import useAxios from "../api/useAxios";
import { QUERY_KEYS } from "../common/queryKeys";

export const useUploadCollectionPreview = () => {
  const { postData } = useAxios();
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string; formData: FormData }>({
    mutationFn: ({ id, formData }) =>
      postData(API_ROUTES.UPLOAD_COLLECTION_PREVIEW(id), formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALL_COLLECTIONS] });
    },
  });
};
