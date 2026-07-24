interface Permission {
  module: string;
  action: string;
}

interface RoleEntry {
  id: number;
  name: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  is_active: boolean | null;
  roles: RoleEntry;
}

interface RolePermissionRow {
  permissions: Permission;
}

export function can(
  userPermissions: Permission[] | null | undefined,
  module: string,
  action: string
): boolean {
  if (!userPermissions) return false;
  return userPermissions.some(
    (p) => p.module === module && (p.action === action || p.action === "CRUD" || p.action === "All")
  );
}

export async function getCurrentUserAccess(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null, roles: [], permissions: [], profile: null };

  const { data: profile, error: profileError }: { data: UserProfile | null; error: any } = await supabase
    .from("users")
    .select("id, full_name, is_active, roles!role_id ( id, name )")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { user, role: null, roles: [], permissions: [], error: profileError.message };
  }

  if (!profile) return { user, role: null, roles: [], permissions: [], profile: null };

  let roleNames: string[] = [];
  let roleIds: number[] = [];

  const { data: multiRoles }: { data: { roles: RoleEntry }[] | null } = await supabase
    .from("user_roles")
    .select("roles ( id, name )")
    .eq("user_id", user.id);

  if (multiRoles && multiRoles.length > 0) {
    roleIds = multiRoles.map((ur) => ur.roles.id);
    roleNames = multiRoles.map((ur) => ur.roles.name);
  } else {
    roleIds = [profile.roles.id];
    roleNames = [profile.roles.name];
  }

  const { data: rolePerms }: { data: RolePermissionRow[] | null } = roleIds.length
    ? await supabase
        .from("role_permissions")
        .select("permissions ( module, action )")
        .in("role_id", roleIds)
    : { data: [] };

  const permissions: Permission[] = (rolePerms ?? []).map((rp) => rp.permissions);

  return {
    user,
    role: roleNames[0] ?? null,
    roles: roleNames,
    permissions,
    profile,
  };
}
