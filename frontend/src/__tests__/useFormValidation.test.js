import { renderHook, act } from "@testing-library/react";
import { useFormValidation } from "../hooks/useFormValidation";
import { loginSchema } from "../lib/validations";

describe("useFormValidation", () => {
  it("returns no errors for valid data", () => {
    const { result } = renderHook(() => useFormValidation(loginSchema));
    
    act(() => {
      const isValid = result.current.validate({ email: "test@test.com", password: "123456" });
      expect(isValid).toBe(true);
    });
    
    expect(result.current.errors).toEqual({});
  });

  it("returns errors for invalid data", () => {
    const { result } = renderHook(() => useFormValidation(loginSchema));
    
    act(() => {
      const isValid = result.current.validate({ email: "", password: "" });
      expect(isValid).toBe(false);
    });
    
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.password).toBeDefined();
  });

  it("validates single field", () => {
    const { result } = renderHook(() => useFormValidation(loginSchema));
    
    act(() => {
      result.current.validateField("email", { email: "bad", password: "123456" });
    });
    
    expect(result.current.errors.email).toBeDefined();
  });

  it("clears field error when valid", () => {
    const { result } = renderHook(() => useFormValidation(loginSchema));
    
    act(() => {
      result.current.validateField("email", { email: "bad", password: "123456" });
    });
    expect(result.current.errors.email).toBeDefined();
    
    act(() => {
      result.current.validateField("email", { email: "good@test.com", password: "123456" });
    });
    expect(result.current.errors.email).toBeUndefined();
  });

  it("resets all state", () => {
    const { result } = renderHook(() => useFormValidation(loginSchema));
    
    act(() => {
      result.current.validate({ email: "", password: "" });
      result.current.touchField("email");
    });
    
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    expect(result.current.touched.email).toBe(true);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});
