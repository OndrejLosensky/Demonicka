import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission } from '@demonicka/shared';
import { UserRole } from '@prisma/client';

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: {
    id: string;
    name: string;
    description: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all roles with their permissions
   */
  async findAll(): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  /**
   * Get a single role with its permissions
   */
  async findOne(id: string): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * Get permissions for a role by role name (for guards)
   */
  async getPermissionsForRole(roleName: string): Promise<Permission[]> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return [];
    }

    return role.permissions.map((rp) => rp.permission.name as Permission);
  }

  /**
   * Update permissions for a role
   */
  async updatePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RoleWithPermissions> {
    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    // Delete all existing role permissions
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
      },
    });

    // Create new role permissions
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }

    // Return updated role with permissions
    return this.findOne(roleId);
  }

  /**
   * Get role by name
   */
  async findByName(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Get all permissions
   */
  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}
