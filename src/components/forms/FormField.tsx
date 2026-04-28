import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helper?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, required, helper, children, className = "" }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
    </div>
  );
}