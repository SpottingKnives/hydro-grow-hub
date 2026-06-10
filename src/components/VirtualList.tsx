import { List, type RowComponentProps } from "react-window";
import { type ReactNode, useMemo } from "react";

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  height?: number;
  threshold?: number;
  className?: string;
  /** Render a single item. The wrapper applies the absolute style for virtualization. */
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
}

/**
 * Virtualizes a list when its length exceeds `threshold`. Below the threshold
 * we render the children inline so layout/padding behaves like the original
 * non-virtualized list. Above it we mount a react-window v2 List with a
 * fixed pixel height for predictable scrolling on Home and GrowCycleDetail.
 */
export function VirtualList<T>({
  items,
  rowHeight,
  height = 480,
  threshold = 30,
  className,
  renderItem,
  getKey,
}: VirtualListProps<T>) {
  // Stable rowProps to avoid unnecessary re-renders inside react-window.
  const rowProps = useMemo(() => ({ items, renderItem, getKey }), [items, renderItem, getKey]);

  if (items.length <= threshold) {
    return (
      <div className={className}>
        {items.map((it, i) => (
          <div key={getKey(it, i)}>{renderItem(it, i)}</div>
        ))}
      </div>
    );
  }

  return (
    <List
      className={className}
      rowCount={items.length}
      rowHeight={rowHeight}
      style={{ height }}
      overscanCount={6}
      rowComponent={Row<T>}
      rowProps={rowProps}
    />
  );
}

function Row<T>({
  index,
  style,
  items,
  renderItem,
  getKey,
}: RowComponentProps<{
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
}>) {
  const item = items[index];
  return (
    <div style={style} key={getKey(item, index)}>
      {renderItem(item, index)}
    </div>
  );
}