import { type FC, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const PhaseNotice: FC<Props> = ({ children }) => {
  return (
    <div
      style={{
        background: "#fff8e1",
        border: "1px solid #ffe082",
        borderRadius: 12,
        padding: "16px 20px",
        fontSize: 13,
        color: "#8d6e00",
      }}
    >
      {children}
    </div>
  );
};

export default PhaseNotice;