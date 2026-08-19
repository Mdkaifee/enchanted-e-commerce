import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  required = true,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">{label}</span>
      <span className="mt-1 flex w-full items-center border border-border bg-background transition-colors focus-within:border-primary">
        <input
          required={required}
          type={visible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="press grid size-10 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 5,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.22em] text-muted-foreground uppercase">{label}</span>
      <textarea
        required={required}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}
