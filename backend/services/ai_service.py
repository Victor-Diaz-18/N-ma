import json
import os
import google.generativeai as genai


class AIService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash") if api_key else None

    async def generate_quiz(self, course_title: str, course_description: str, lessons: list[dict], num_questions: int = 5) -> list[dict]:
        if not self.model:
            raise ValueError("GEMINI_API_KEY no configurada")

        lessons_text = ""
        for i, lesson in enumerate(lessons, 1):
            title = lesson.get("title", f"Lección {i}")
            content = lesson.get("content", "")
            lessons_text += f"\n--- Lección {i}: {title} ---\n{content}\n"

        prompt = f"""Eres un profesor experto en crear evaluaciones educativas.

Basado en el siguiente contenido de un curso, genera {num_questions} preguntas de opción múltiple.

CURSO: {course_title}
DESCRIPCIÓN: {course_description}

CONTENIDO DEL CURSO:
{lessons_text if lessons_text else "No hay contenido detallado de lecciones disponible."}

REGLAS:
1. Cada pregunta debe tener exactamente 4 opciones
2. Solo una respuesta puede ser correcta
3. Las preguntas deben ser variadas (comprensión, aplicación, análisis)
4. Las opciones incorrectas deben ser creíbles
5. Responde SOLO con JSON válido, sin texto adicional

Formato de respuesta:
[
  {{
    "question": "Texto de la pregunta",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correct_index": 0
  }}
]

Genera las preguntas ahora:"""

        response = self.model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        questions = json.loads(text)

        validated = []
        for q in questions:
            if "question" in q and "options" in q and "correct_index" in q:
                if len(q["options"]) >= 2 and 0 <= q["correct_index"] < len(q["options"]):
                    validated.append({
                        "question": q["question"],
                        "options": q["options"],
                        "correct_index": q["correct_index"],
                    })

        return validated[:num_questions]
