'use client';

import { SWRConfiguration } from 'swr';
import useSWR, { mutate } from 'swr';
import { axiosClient } from './axios';

const fetcher = async (url: string) => {
  const response = await axiosClient.get(url);
  return response.data;
};

const fetcherPost = async (url: string, body: any) => {
  const response = await axiosClient.post(url, body);
  return response.data;
};

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  dedupingInterval: 2000,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

type ResourceOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  fallbackData?: T;
};

export function useResource<T = any>(baseUrl: string, options?: ResourceOptions<T>) {
  const { data, error, isLoading, mutate: refresh } = useSWR<T>(
    baseUrl,
    fetcher,
    { fallbackData: options?.fallbackData }
  );

  const create = async (data: Partial<T>) => {
    try {
      const response = await axiosClient.post(baseUrl, data);
      await mutate(baseUrl); // Refresh the list
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create resource');
      options?.onError?.(error);
      throw error;
    }
  };

  const update = async (id: string, data: Partial<T>) => {
    try {
      const response = await axiosClient.patch(`${baseUrl}/${id}`, data);
      await mutate(baseUrl); // Refresh the list
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
      const response = await axiosClient.delete(`${baseUrl}/${id}`);
      await mutate(baseUrl); // Refresh the list
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
      const response = await axiosClient.get(`${baseUrl}/${id}`);
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

export { fetcher, fetcherPost, swrConfig }; 