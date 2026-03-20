import React from "react";
import { Search } from "lucide-react";

export interface ToolbarFilterOption {
  label: string;
  value: string;
}

export interface ToolbarFilterConfig {
  key: string;
  label: string;
  value: string;
  options: ToolbarFilterOption[];
  onChange: (value: string) => void;
}

interface DataTableToolbarProps {
  title: string;
  description?: string;
  searchValue: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  filters?: ToolbarFilterConfig[];
  actions?: React.ReactNode;
  stats?: React.ReactNode;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  title,
  description,
  searchValue,
  searchPlaceholder = "Search records...",
  onSearchChange,
  filters = [],
  actions,
  stats,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 shadow-sm">
            <Search size={14} className="text-muted-foreground" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground md:w-56"
            />
          </div>

          {filters.map((filter) => (
            <label key={filter.key} className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">{filter.label}</span>
              <select
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
                className="bg-transparent text-sm text-foreground outline-none"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {stats && <div className="flex flex-wrap gap-2">{stats}</div>}
      </div>
    </div>
  );
};
