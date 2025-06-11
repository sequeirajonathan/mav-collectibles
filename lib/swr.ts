'use client';

import { SWRConfiguration } from 'swr';
import useSWR, { mutate } from 'swr';
import { axiosClient } from './axios';
import { toast } from 'react-hot-toast';

const fetcher = async <T = unknown>(url: string): Promise<T> => {
  try {
    const response = await axiosClient.get<T>(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    throw error;
  }
};

const fetcherPost = async <TResponse = unknown, TRequest = unknown>(url: string, body: TRequest): Promise<TResponse> => {
  try {
    const response = await axiosClient.post<TResponse>(url, body);
    return response.data;
  } catch (error) {
    console.error(`Failed to POST to ${url}:`, error);
    throw error;
  }
};

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  dedupingInterval: 2000,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  onError: (error, _key, _config) => {
    if (error.message.includes('ERR_CONNECTION_REFUSED')) {
      toast.error('Unable to connect to the server. Please check if the API server is running.');
    } else {
      toast.error('An error occurred while fetching data');
    }
  }
};

type ResourceOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  fallbackData?: T;
};

export function useResource<TResponse = unknown, TRequest = unknown>(baseUrl: string, options?: ResourceOptions<TResponse>) {
  const { data, error, isLoading, mutate: refresh } = useSWR<TResponse>(
    baseUrl,
    fetcher,
    { 
      ...swrConfig,
      fallbackData: options?.fallbackData,
      onError: (error, key, config) => {
        swrConfig.onError?.(error, key, config);
        options?.onError?.(error);
      }
    }
  );

  const create = async (data: TRequest) => {
    try {
      const response = await axiosClient.post<TResponse>(baseUrl, data);
      await mutate(baseUrl);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create resource');
      options?.onError?.(error);
      throw error;
    }
  };

  const update = async (id: string, data: Partial<TRequest>) => {
    try {
      const response = await axiosClient.patch<TResponse>(`${baseUrl}/${id}`, data);
      await mutate(baseUrl);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update resource');
      options?.onError?.(error);
      throw error;
    }
  };

  const remove = async (id: string) => {
    try {
      const response = await axiosClient.delete<TResponse>(`${baseUrl}/${id}`);
      await mutate(baseUrl);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete resource');
      options?.onError?.(error);
      throw error;
    }
  };

  const getOne = async (id: string) => {
    try {
      const response = await axiosClient.get<TResponse>(`${baseUrl}/${id}`);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch resource');
      options?.onError?.(error);
      throw error;
    }
  };

  return {
    data,
    error,
    isLoading,
    create,
    update,
    remove,
    getOne,
    refresh,
  };
}

export { fetcherPost, swrConfig }; 