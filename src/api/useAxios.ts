import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import { useCallback, useMemo } from 'react';

const env = (import.meta as unknown as { env: Record<string, string> }).env;
const BASE_URL =
  env.VITE_APP_BASE_URL ||
  env.VITE_API_BASE_URL ||
  'https://api.beheyt.hexacoder.co/api';

const safeRequest = async (func: () => Promise<unknown>) => {
  try {
    const response = await func();
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error with API request: ' + String(error));
    throw error;
  }
};

const useAxios = () => {
  const COMMON_HEADERS = useMemo(
    () => ({
      Authorization: 'Bearer ' + localStorage.getItem('jwtToken'),
      'Content-Type': 'application/json',
    }),
    [],
  );

  const getAuthHeaders = () => {
    const token = localStorage.getItem('jwtToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    };
  };

  const FORM_DATA_HEADERS = useMemo(
    () => ({
      Authorization: 'Bearer ' + localStorage.getItem('jwtToken'),
      'Content-Type': 'multipart/form-data',
    }),
    [],
  );

  interface GetDataParams {
    [key: string]: string | number | boolean | undefined;
  }

  interface DeleteDataOptions {
    [key: string]: unknown;
  }

  interface PutFileOptions {
    headers?: Record<string, string>;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }

  type IdsType = string | number | (string | number)[] | null;

  const getData = useCallback(
    /**
     * function given to callback returns another function called safe request
     */
    async (
      url: string,
      id: string | number | (string | number)[] | null = null,
      params?: GetDataParams,
    ): Promise<unknown> =>
      /**
       * safe request function is called takes two args as input
       * first is function that makes api call
       */
      safeRequest(async () => {
        // Construct the base URL
        let fullUrl = BASE_URL + url;

        // Check if id is provided
        if (id) {
          if (Array.isArray(id)) {
            // Join array elements into a single string separated by slashes
            fullUrl = fullUrl + '/' + id.join('/');
          } else {
            // Use id directly if it's a string
            fullUrl = fullUrl + '/' + id;
          }
        }

        // Append the params object as a query string if provided
        if (params && typeof params === 'object') {
          // Convert the params object to a query string
          const queryString = new URLSearchParams(
            params as Record<string, string>,
          ).toString();
          fullUrl = fullUrl + '?' + queryString;
        }

        // Make the GET request with the full URL

        const token = localStorage.getItem('jwtToken');
        const headers = token ? { Authorization: 'Bearer ' + token } : {};
        const response = await axios.get(fullUrl, {
          headers,
        });

        // Return the response data
        return response.data;
      }),
    [],
  );

  const postData = useCallback(
    async (url: string, data: object = {}) =>
      safeRequest(async () => {
        const isFormData = data instanceof FormData;
        const response = await axios.post(BASE_URL + url, data, {
          headers: isFormData ? FORM_DATA_HEADERS : COMMON_HEADERS,
        });

        return response.data;
      }),
    [COMMON_HEADERS, FORM_DATA_HEADERS],
  );

  const putData = useCallback(
    async (url: string, ids: IdsType = null, data: object = {}) =>
      safeRequest(async () => {
        try {
          // Determine if ids is an array or a single value and append appropriately
          const idsPath = Array.isArray(ids) ? ids.join('/') : ids ? ids : '';

          // Construct the final URL with the ids path if provided
          const finalUrl = idsPath
            ? BASE_URL + url + '/' + idsPath
            : BASE_URL + url;
          const isFormData = data instanceof FormData;

          const response = await axios.put(finalUrl, data, {
            headers: isFormData ? FORM_DATA_HEADERS : COMMON_HEADERS,
          });

          return response.data;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error with PUT request: ' + String(error));
          throw error;
        }
      }),
    [COMMON_HEADERS, FORM_DATA_HEADERS],
  );

  const patchData = useCallback(
    async (url: string, data: object = {}) =>
      safeRequest(async () => {
        try {
          // Construct the final URL with the ids path if provided
          const finalUrl = BASE_URL + url;
          const isFormData = data instanceof FormData;

          const response = await axios.patch(finalUrl, data, {
            headers: isFormData ? FORM_DATA_HEADERS : COMMON_HEADERS,
          });
          return response.data;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error with PATCH request: ' + String(error));
          throw error;
        }
      }),
    [COMMON_HEADERS, FORM_DATA_HEADERS],
  );

  const deleteData = useCallback(
    async (
      url: string,
      id: string | number | (string | number)[] | null = '',
      data: DeleteDataOptions = {},
    ): Promise<unknown> =>
      safeRequest(async () => {
        try {
          const fullUrl = id
            ? BASE_URL + url + '/' + (Array.isArray(id) ? id.join('/') : id)
            : BASE_URL + url;
          const response = await axios.delete(fullUrl, {
            data,
            headers: COMMON_HEADERS,
          });
          return response.data;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error with DELETE request: ' + String(error));
          throw error;
        }
      }),
    [COMMON_HEADERS],
  );

  const putFile = useCallback(
    async (url: string, file: File | Blob, options: PutFileOptions = {}) => {
      return safeRequest(async () => {
        try {
          const response = await axios.put(url, file, {
            headers: options.headers || {}, // Pass any custom headers
            onUploadProgress: options.onUploadProgress, // Handle upload progress
          });
          return response;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error with PUT request: ' + String(error));
          throw error;
        }
      });
    },
    [],
  );

  const getFile = useCallback(
    async (
      url: string,
      id: string | number | (string | number)[] | null = null,
      params?: Record<string, string>,
    ): Promise<unknown> =>
      safeRequest(async () => {
        // Build full URL
        let fullUrl = BASE_URL + url;

        if (id) {
          fullUrl += '/' + (Array.isArray(id) ? id.join('/') : id);
        }

        if (params) {
          const queryString = new URLSearchParams(params).toString();
          fullUrl += '?' + queryString;
        }

        const token = localStorage.getItem('jwtToken');
        const headers = token ? { Authorization: 'Bearer ' + token } : {};
        const response = await axios.get(fullUrl, {
          headers,
          responseType: 'blob', // crucial for file download
        });

        const blob = response.data;
        let filename = 'downloaded-file';

        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match?.[1]) {
            filename = decodeURIComponent(match[1] as string);
          }
        }

        const blobUrl = window.URL.createObjectURL(blob as Blob | MediaSource);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      }),
    [],
  );

  const getFileBlob = useCallback(
    async (
      url: string,
      id: string | number | (string | number)[] | null = null,
      params?: Record<string, string>,
    ): Promise<string> => {
      const result = await safeRequest(async () => {
        // Build full URL
        let fullUrl = BASE_URL + url;

        if (id) {
          fullUrl += '/' + (Array.isArray(id) ? id.join('/') : id);
        }

        if (params) {
          const queryString = new URLSearchParams(params).toString();
          fullUrl += '?' + queryString;
        }
        const token = localStorage.getItem('jwtToken');
        const headers = token ? { Authorization: 'Bearer ' + token } : {};
        const response = await axios.get(fullUrl, {
          headers,
          responseType: 'blob',
        });

        const blob = response.data;
        const blobUrl = window.URL.createObjectURL(blob as Blob | MediaSource);
        return blobUrl;
      });
      return result as string;
    },
    [],
  );

  const logout = useCallback(
    async () =>
      safeRequest(async () => {
        const response = await axios.get(BASE_URL + '/auth/logout', {
          headers: getAuthHeaders(), // ✅ token read dynamically here
        });
        return response.data;
      }),
    [],
  );

  return {
    deleteData,
    getData,
    getFile,
    getFileBlob,
    logout,
    patchData,
    postData,
    putData,
    putFile,
  };
};

export default useAxios;
