import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface BaseProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

interface InputFieldProps
  extends BaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  as?: "input";
}

interface TextareaFieldProps
  extends BaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> {
  as: "textarea";
}

interface SelectFieldProps extends BaseProps {
  as: "select";
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, name, error, required, hint, as = "input", ...rest } = props;
  const id = `field-${name}`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {as === "textarea" ? (
        <textarea
          id={id}
          name={name}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
            error ? "border-red-300" : "border-gray-300"
          }`}
          rows={4}
          {...(rest as Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name">)}
        />
      ) : as === "select" ? (
        <select
          id={id}
          name={name}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
            error ? "border-red-300" : "border-gray-300"
          }`}
          value={(props as SelectFieldProps).value}
          onChange={(props as SelectFieldProps).onChange}
        >
          {(props as SelectFieldProps).options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
            error ? "border-red-300" : "border-gray-300"
          }`}
          {...(rest as Omit<InputHTMLAttributes<HTMLInputElement>, "name">)}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
