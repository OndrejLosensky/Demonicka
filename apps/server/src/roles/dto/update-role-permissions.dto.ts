import { IsArray, IsUUID } from 'class-validator';

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
