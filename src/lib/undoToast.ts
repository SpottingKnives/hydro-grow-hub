import { toast } from "sonner";
import { useStore } from "@/store/useStore";

/**
 * Snapshot keys used for restoring deletes. We snapshot the relevant
 * state slices before deletion, then on undo we splice the previously
 * removed rows back in (preserving any newer items the user added).
 */
type StoreState = ReturnType<typeof useStore.getState>;
type Slice = keyof StoreState;

const SLICE_ID = "id" as const;

function diff<T extends { id: string }>(before: T[], after: T[]): T[] {
  const afterIds = new Set(after.map((x) => x.id));
  return before.filter((x) => !afterIds.has(x.id));
}

export interface UndoableDeleteOptions {
  /** Label shown in the toast, e.g. "Task deleted". */
  label: string;
  /** Slices that may be mutated by the delete. */
  slices: Slice[];
  /** Perform the destructive action. */
  perform: () => void;
  /** Optional override description. */
  description?: string;
}

/**
 * Runs a destructive store action and shows a sonner toast with an Undo
 * action that restores any rows removed from the given slices.
 *
 * Restores by merging the removed items back into each slice; if the user
 * has added new items in the meantime they are preserved.
 */
export function undoableDelete({ label, slices, perform, description }: UndoableDeleteOptions): void {
  const before = useStore.getState();
  const snapshots: Partial<Record<Slice, unknown[]>> = {};
  for (const s of slices) {
    const arr = before[s] as unknown;
    if (Array.isArray(arr)) snapshots[s] = [...arr];
  }

  perform();

  toast(label, {
    description,
    duration: 6000,
    action: {
      label: "Undo",
      onClick: () => {
        const current = useStore.getState();
        const patch: Record<string, unknown[]> = {};
        for (const s of slices) {
          const beforeArr = snapshots[s] as { id: string }[] | undefined;
          const currentArr = current[s] as unknown;
          if (!beforeArr || !Array.isArray(currentArr)) continue;
          const removed = diff(beforeArr, currentArr as { id: string }[]);
          if (removed.length === 0) continue;
          patch[s] = [...(currentArr as { id: string }[]), ...removed];
        }
        if (Object.keys(patch).length > 0) {
          useStore.setState(patch as Partial<StoreState>);
        }
      },
    },
  });

  // touch SLICE_ID so tsc doesn't complain about unused const in strict mode
  void SLICE_ID;
}