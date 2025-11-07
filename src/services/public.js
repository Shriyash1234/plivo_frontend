import { apiClient } from './api-client';

export const fetchPublicOrganizations = async () => {
  const response = await apiClient.get('/public/organizations');
  return response.organizations ?? [];
};

export const fetchStatusSnapshot = async (identifier) => {
  const params = new URLSearchParams();
  if (identifier) {
    params.set('organizationId', identifier);
  }
  return apiClient.get(`/public/status?${params.toString()}`);
};
