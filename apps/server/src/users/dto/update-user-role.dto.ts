import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(UserRole, {
    message: 'Role must be one of: SUPER_ADMIN, OPERATOR, USER, PARTICIPANT',
  })
  role!: UserRole;
}

