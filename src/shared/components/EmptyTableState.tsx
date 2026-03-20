import React from "react";

type EmptyTableStateProps = {
  colSpan: number;
  title: string;
  description?: string;
};

export const EmptyTableState: React.FC<EmptyTableStateProps> = ({ colSpan, title, description }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center">
      <div className="mx-auto max-w-md space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
    </td>
  </tr>
);
