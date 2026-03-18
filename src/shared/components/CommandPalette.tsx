import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Command, Undo2, AlertCircle } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  category: string;
}

interface Props {
  items: CommandItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CommandPalette: React.FC<Props> = ({ items, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(controlledOpen ?? false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    else setInternalOpen(newOpen);
    if (newOpen) setQuery("");
    setSelectedIndex(0);
  }, [onOpenChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      handleOpenChange(!open);
    }
    if (e.key === "Escape") handleOpenChange(false);
  }, [open, handleOpenChange]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filtered = useMemo(() => 
    items.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    ), 
    [items, query]
  );

  const grouped = useMemo(() => 
    filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {}),
    [filtered]
  );

  const flatItems = useMemo(() => 
    Object.values(grouped).flat(),
    [grouped]
  );

  const handleKeyboardNavigation = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
        handleOpenChange(false);
      }
    }
  }, [flatItems, selectedIndex, handleOpenChange]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] animate-fade-in" onClick={() => handleOpenChange(false)}>
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <Search size={18} className="text-primary flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyboardNavigation}
            placeholder="Search pages, actions, and settings..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[10px] font-mono text-muted-foreground border border-border/50">
              <Command size={12} /> K
            </kbd>
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[10px] font-mono text-muted-foreground border border-border/50">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3">
          {Object.entries(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle size={32} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No results found</p>
              <p className="text-xs text-muted-foreground">Try searching for pages, actions, or settings</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, catItems]) => (
              <div key={category} className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-2">
                  {category}
                </p>
                <div className="space-y-1">
                  {catItems.map((item, idx) => {
                    const globalIndex = flatItems.indexOf(item);
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.action();
                          handleOpenChange(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all group ${
                          isSelected
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "hover:bg-muted/60 text-foreground border border-transparent"
                        }`}
                      >
                        {item.icon && (
                          <span className={`flex-shrink-0 transition-colors ${
                            isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          }`}>
                            {item.icon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          {item.description && (
                            <p className={`text-xs truncate ${
                              isSelected ? "text-primary/70" : "text-muted-foreground"
                            }`}>
                              {item.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-[10px] font-mono text-primary">
                            ENTER
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 rounded text-[9px] bg-background border border-border">↑</kbd>
              <kbd className="px-1.5 rounded text-[9px] bg-background border border-border">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 rounded text-[9px] bg-background border border-border">⏎</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 rounded text-[9px] bg-background border border-border">ESC</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
};
