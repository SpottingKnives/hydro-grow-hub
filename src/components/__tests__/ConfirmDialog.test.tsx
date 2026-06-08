import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function Harness({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete the item?"
      description="Permanent action."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      destructive
      onConfirm={() => { onConfirm(); setOpen(false); }}
    />
  );
}

describe("ConfirmDialog", () => {
  it("renders title/description and calls onConfirm when Delete is clicked", () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Delete the item?")).toBeInTheDocument();
    expect(screen.getByText("Permanent action.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when Cancel is clicked and closes the dialog", () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders children (e.g. embedded picker) and respects confirmDisabled", () => {
    function PickerHarness() {
      const [open, setOpen] = useState(true);
      const [count, setCount] = useState(0);
      return (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Downsize"
          confirmDisabled={count < 1}
          onConfirm={() => setOpen(false)}
        >
          <button type="button" onClick={() => setCount((c) => c + 1)}>tick {count}</button>
        </ConfirmDialog>
      );
    }
    render(<PickerHarness />);
    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /tick/ }));
    expect(screen.getByRole("button", { name: "Confirm" })).not.toBeDisabled();
  });
});