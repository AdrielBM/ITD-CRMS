import Sidebar from "./Sidebar";

export default function AppShell({ children, fullName, email, role, roles, currentPath = "" }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        fullName={fullName}
        email={email}
        role={role}
        roles={roles}
        currentPath={currentPath}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
