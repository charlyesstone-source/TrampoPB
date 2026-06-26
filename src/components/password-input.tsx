"use client";

import { useState } from "react";
import { IconEye, IconEyeOff } from "./icons";

/** Campo de senha com botão "olho" para mostrar/ocultar. */
export function PasswordInput({
  id,
  placeholder,
  required,
}: {
  id: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="pass-wrap">
      <input
        className="in"
        id={id}
        name={id}
        type={mostrar ? "text" : "password"}
        placeholder={placeholder}
        required={required}
      />
      <button
        type="button"
        className="eye"
        onClick={() => setMostrar((m) => !m)}
        aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
      >
        {mostrar ? (
          <IconEyeOff width={20} height={20} />
        ) : (
          <IconEye width={20} height={20} />
        )}
      </button>
    </div>
  );
}
