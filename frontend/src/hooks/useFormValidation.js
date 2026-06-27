import { useState } from "react";

export function useFormValidation(schema) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data) => {
    const result = schema.safeParse(data);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors = {};
    result.error.errors.forEach((err) => {
      fieldErrors[err.path[0]] = err.message;
    });
    setErrors(fieldErrors);
    return false;
  };

  const validateField = (name, data) => {
    const result = schema.safeParse(data);
    if (result.success) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      return;
    }
    const fieldError = result.error.errors.find((err) => err.path[0] === name);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError ? fieldError.message : undefined,
    }));
  };

  const touchField = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const reset = () => {
    setErrors({});
    setTouched({});
  };

  return { errors, touched, validate, validateField, touchField, reset };
}
