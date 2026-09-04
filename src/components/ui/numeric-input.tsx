"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  allowDecimal?: boolean;
  suffix?: string;
  placeholder?: string;
}

export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      min,
      max,
      step,
      allowDecimal = true,
      suffix,
      placeholder,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const formatValue = React.useCallback(
      (val: number | null | undefined): string => {
        if (val === null || val === undefined || !Number.isFinite(val)) {
          return "";
        }
        return val.toString();
      },
      []
    );

    const [isFocused, setIsFocused] = React.useState(false);
    const [localText, setLocalText] = React.useState<string>(() => formatValue(value));

    // Synchronize localText with external value changes when not actively typing/focused
    React.useEffect(() => {
      if (!isFocused) {
        setLocalText(formatValue(value));
      }
    }, [value, isFocused, formatValue]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;

      // Allow empty string to permit clearing the input
      if (raw === "") {
        setLocalText("");
        onValueChange(null);
        return;
      }

      // Filter characters
      const cleaned = allowDecimal
        ? raw.replace(/[^0-9.]/g, "")
        : raw.replace(/[^0-9]/g, "");

      // Prevent multiple decimal points
      if (allowDecimal && (cleaned.match(/\./g) || []).length > 1) {
        return;
      }

      setLocalText(cleaned);

      if (cleaned === "" || cleaned === ".") {
        onValueChange(null);
        return;
      }

      const num = Number(cleaned);
      if (Number.isFinite(num)) {
        onValueChange(num);
      }
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Auto-select text if value is 0 for fast overwrite
      if (value === 0 && localText === "0") {
        event.target.select();
      }
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      if (localText === "" || localText === ".") {
        if (typeof min === "number" && min > 0) {
          // If a positive min is mandatory (e.g. piecesPerBox >= 1)
          setLocalText(min.toString());
          onValueChange(min);
        } else {
          setLocalText("");
          onValueChange(null);
        }
      } else {
        const num = Number(localText);
        if (Number.isFinite(num)) {
          let bounded = num;
          if (typeof min === "number") bounded = Math.max(min, bounded);
          if (typeof max === "number") bounded = Math.min(max, bounded);

          setLocalText(bounded.toString());
          onValueChange(bounded);
        } else {
          setLocalText(formatValue(value));
        }
      }

      onBlur?.(event);
    };

    return (
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="text"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            suffix && "pr-12",
            className
          )}
          value={localText}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-label={props["aria-label"]}
          {...(step ? { step } : {})}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground select-none">
            {suffix}
          </span>
        ) : null}
      </div>
    );
  }
);
NumericInput.displayName = "NumericInput";