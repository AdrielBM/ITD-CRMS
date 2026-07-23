/**
 * Given a user's role_permissions (already fetched from Supabase) and a
 * module/action pair, returns whether that role can do it.
 *
 * Call this from Server Actions / Route Handlers as the real guard.
 * Client-side use of this same function is only for hiding/disabling
 * UI — never trust it as the actual security boundary.
 */
export function can(userPermissions, module, action) {
  if (!userPermissions) return false;
  return userPermissions.some(
    (p) => p.module === module && (p.action === action || p.action === "CRUD" || p.action === "All")
  );
}

/**
 * Fetches the current logged-in user's role + flat permission list.
 * Use in Server Components/Actions: const { role, permissions } = await getCurrentUserAccess(supabase)
 */
export async function getCurrentUserAccess(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null, permissions: [] };

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, full_name, is_active, roles ( id, name )")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("getCurrentUserAccess profile query error:", profileError);
    return { user, role: null, permissions: [], error: profileError.message };
  }

  if (!profile) return { user, role: null, permissions: [] };

  const { data: rolePerms } = await supabase
    .from("role_permissions")
    .select("permissions ( module, action )")
    .eq("role_id", profile.roles.id);

  const permissions = (rolePerms ?? []).map((rp) => rp.permissions);

  return { user, role: profile.roles.name, permissions, profile };
}