import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("Ingresa un correo válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("Ingresa un correo válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128, "La contraseña es demasiado larga"),
});

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título es demasiado largo"),
  subject: z
    .string()
    .min(2, "La materia debe tener al menos 2 caracteres")
    .max(50, "La materia es demasiado larga"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción es demasiado larga"),
});

export const lessonSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título es demasiado largo"),
  content: z
    .string()
    .min(10, "El contenido debe tener al menos 10 caracteres"),
  order: z
    .number()
    .min(1, "El orden debe ser mayor a 0"),
});

export const activitySchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título es demasiado largo"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  activity_type: z.enum(["quiz", "assignment", "lab"], {
    errorMap: () => ({ message: "Selecciona un tipo de actividad válido" }),
  }),
  questions: z
    .array(
      z.object({
        question: z.string().min(1, "La pregunta es requerida"),
        options: z.array(z.string()).min(2, "Mínimo 2 opciones"),
        correct_answer: z.number(),
        points: z.number().min(1),
      })
    )
    .min(1, "Agrega al menos una pregunta"),
});
