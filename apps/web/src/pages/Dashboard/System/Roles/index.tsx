import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { rolesService, type RoleWithPermissions, type RolePermission } from '../../../../services/rolesService';
import { Permission, PERMISSION_DESCRIPTIONS } from '@demonicka/shared';
import { usePageTitle } from '../../../../hooks/usePageTitle';
import { PageHeader } from '@demonicka/ui';
import { toast } from 'react-hot-toast';

const RolesPage: React.FC = () => {
  usePageTitle('Role a oprávnění');
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modifiedRoles, setModifiedRoles] = useState<Record<string, Set<string>>>({});

  const loadRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await rolesService.getAllRoles();
      setRoles(data.roles);
      setAllPermissions(data.allPermissions);
      setModifiedRoles({});
    } catch (error) {
      console.error('Failed to load roles:', error);
      toast.error('Nepodařilo se načíst role');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    setModifiedRoles((prev) => {
      const role = roles.find((r) => r.id === roleId);
      if (!role) return prev;

      const newSet = new Set(prev[roleId] || role.permissions.map((p) => p.id));
      
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }

      return {
        ...prev,
        [roleId]: newSet,
      };
    });
  };

  const handleSave = async (roleId: string) => {
    try {
      setIsSaving(true);
      const permissionIds = Array.from(modifiedRoles[roleId] || []);
      await rolesService.updateRolePermissions(roleId, permissionIds);
      toast.success('Oprávnění byla úspěšně aktualizována');
      await loadRoles();
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast.error('Nepodařilo se uložit oprávnění');
    } finally {
      setIsSaving(false);
    }
  };

  // Create permission ID map from allPermissions
  const permissionIdMap = new Map<string, string>();
  allPermissions.forEach((perm) => {
    permissionIdMap.set(perm.name, perm.id);
  });

  const getPermissionId = (permissionName: string): string | null => {
    return permissionIdMap.get(permissionName) || null;
  };

  const hasPermission = (role: RoleWithPermissions, permissionName: string): boolean => {
    const permissionId = getPermissionId(permissionName);
    if (!permissionId) return false;

    if (modifiedRoles[role.id]) {
      return modifiedRoles[role.id].has(permissionId);
    }
    return role.permissions.some((p) => p.name === permissionName);
  };

  const hasChanges = (roleId: string): boolean => {
    return !!modifiedRoles[roleId];
  };

  // Get all permissions from enum for display
  const allPermissionNames = Object.values(Permission);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <PageHeader
        title="Role a oprávnění"
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRoles}
            disabled={isLoading}
          >
            Obnovit
          </Button>
        }
      />

      <Box sx={{ mt: 3 }}>
        {roles.map((role) => (
          <Accordion key={role.id} defaultExpanded={role.name === 'OPERATOR'}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography variant="h6">{role.name}</Typography>
                {role.description && (
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
                  </Typography>
                )}
                {hasChanges(role.id) && (
                  <Chip label="Neuloženo" color="warning" size="small" />
                )}
                <Box sx={{ flexGrow: 1 }} />
                {hasChanges(role.id) && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(role.id);
                    }}
                    disabled={isSaving}
                  >
                    Uložit
                  </Button>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox disabled />
                      </TableCell>
                      <TableCell>Oprávnění</TableCell>
                      <TableCell>Popis</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allPermissionNames.map((permission) => {
                      const permissionId = getPermissionId(permission);
                      const isChecked = permissionId ? hasPermission(role, permission) : false;
                      const permissionData = allPermissions.find((p) => p.name === permission);
                      
                      return (
                        <TableRow key={permission}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isChecked}
                              onChange={() => {
                                if (permissionId) {
                                  handlePermissionToggle(role.id, permissionId);
                                }
                              }}
                              disabled={!permissionId || role.name === 'SUPER_ADMIN'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {permission}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={permissionData?.description || PERMISSION_DESCRIPTIONS[permission] || ''}>
                              <Typography variant="body2" color="text.secondary">
                                {permissionData?.description || PERMISSION_DESCRIPTIONS[permission] || 'Bez popisu'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default RolesPage;
