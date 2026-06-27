import { loginSchema, registerSchema, courseSchema } from "../lib/validations";

describe("loginSchema", () => {
  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "pass" });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain("requerido");
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "pass" });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain("válido");
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid data", () => {
    const result = loginSchema.safeParse({ email: "test@correo.com", password: "123456" });
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("rejects short name", () => {
    const result = registerSchema.safeParse({ name: "A", email: "a@b.com", password: "123456" });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain("2 caracteres");
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({ name: "Ana", email: "a@b.com", password: "123" });
    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain("6 caracteres");
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ name: "Ana", email: "bad", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("accepts valid data", () => {
    const result = registerSchema.safeParse({ name: "Ana Perez", email: "ana@correo.com", password: "123456" });
    expect(result.success).toBe(true);
  });
});

describe("courseSchema", () => {
  it("rejects short title", () => {
    const result = courseSchema.safeParse({ title: "AB", subject: "Math", description: "A valid description" });
    expect(result.success).toBe(false);
  });

  it("rejects short subject", () => {
    const result = courseSchema.safeParse({ title: "Course", subject: "A", description: "A valid description" });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = courseSchema.safeParse({ title: "Course", subject: "Math", description: "Short" });
    expect(result.success).toBe(false);
  });

  it("accepts valid data", () => {
    const result = courseSchema.safeParse({ title: "Biologia", subject: "Ciencias", description: "Un curso completo de biologia celular" });
    expect(result.success).toBe(true);
  });
});
