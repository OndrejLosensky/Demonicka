import { api } from './api';

export interface RolePermission {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  roles: RoleWithPermissions[];
  allPermissions: RolePermission[];
}

export const rolesService = {
  async getAllRoles(): Promise<RolesResponse> {
    const response = await api.get('/system/roles');
    return response.data;
  },

  async getRole(id: string): Promise<RoleWithPermissions> {
    const response = await api.get(`/system/roles/${id}`);
    return response.data;
  },

  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleWithPermissions> {
    const response = await api.put(`/system/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data;
  },
};
