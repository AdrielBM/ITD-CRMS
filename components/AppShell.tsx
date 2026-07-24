import { type FC, type ReactNode } from "react";
import Sidebar from "./Sidebar";

interface Props {
  children: ReactNode;
  fullName: string | null;
  email: string | null;
  role: string | null;
  roles: string[];
  currentPath?: string;
}

const AppShell: FC<Props> = ({ children, fullName, email, role, roles, currentPath = "" }) => {
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
};

export default AppShell;