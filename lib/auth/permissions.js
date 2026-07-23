/**
 * Given a user's role_permissions (already fetched from Supabase) and a
 * module/action pair, returns whether that role can do it.
 */
export function can(userPermissions, module, action) {
  if (!userPermissions) return false;
  return userPermissions.some(
    (p) => p.module === module && (p.action === action || p.action === "CRUD" || p.action === "All")
  );
}

/**
 * Fetches the current logged-in user's roles + flat permission list.
 * In multi-role mode, permissions are merged from all assigned roles.
 * Use in Server Components/Actions: const { role, roles, permissions } = await getCurrentUserAccess(supabase)
 */
export async function getCurrentUserAccess(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null, roles: [], permissions: [] };

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, full_name, is_active, roles ( id, name )")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { user, role: null, roles: [], permissions: [], error: profileError.message };
  }

  if (!profile) return { user, role: null, roles: [], permissions: [] };

  // Fetch all roles from user_roles (multi-role support) — falls back to single role
  let roleNames = [];
  let roleIds = [];

  const { data: multiRoles } = await supabase
    .from("user_roles")
    .select("roles ( id, name )")
    .eq("user_id", user.id);

  if (multiRoles && multiRoles.length > 0) {
    roleIds = multiRoles.map((ur) => ur.roles.id);
    roleNames = multiRoles.map((ur) => ur.roles.name);
  } else {
    // Fallback: single role from users.role_id
    roleIds = [profile.roles.id];
    roleNames = [profile.roles.name];
  }

  // Merge permissions from all roles
  const { data: rolePerms } = roleIds.length
    ? await supabase
        .from("role_permissions")
        .select("permissions ( module, action )")
        .in("role_id", roleIds)
    : { data: [] };

  const permissions = (rolePerms ?? []).map((rp) => rp.permissions);

  return {
    user,
    role: roleNames[0] ?? null,
    roles: roleNames,
    permissions,
    profile,
  };
}
