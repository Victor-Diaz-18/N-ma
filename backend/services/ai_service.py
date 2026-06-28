import json
import os
import google.generativeai as genai


class AIService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash") if api_key else None

    async def generate_activity(self, course_title: str, course_description: str, lessons: list[dict], activity_type: str, num_questions: int = 5) -> dict:
        if not self.model:
            raise ValueError("GEMINI_API_KEY no configurada")

        lessons_text = ""
        for i, lesson in enumerate(lessons, 1):
            title = lesson.get("title", f"Lección {i}")
            content = lesson.get("content", "")
            lessons_text += f"\n--- Lección {i}: {title} ---\n{content}\n"

        content_section = lessons_text if lessons_text else "No hay contenido detallado de lecciones disponible."

        prompts = {
            "quiz": f"""Eres un profesor experto en crear evaluaciones educativas.

Basado en el siguiente contenido de un curso, genera {num_questions} preguntas de opción múltiple.

CURSO: {course_title}
DESCRIPCIÓN: {course_description}

CONTENIDO DEL CURSO:
{content_section}

REGLAS:
1. Cada pregunta debe tener exactamente 4 opciones
2. Solo una respuesta puede ser correcta
3. Las preguntas deben ser variadas (comprensión, aplicación, análisis)
4. Las opciones incorrectas deben ser creíbles
5. Responde SOLO con JSON válido, sin texto adicional

Formato de respuesta:
{{
  "title": "Título del quiz",
  "description": "Descripción breve del quiz",
  "questions": [
    {{
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct_index": 0
    }}
  ]
}}

Genera las preguntas ahora:""",

            "exam": f"""Eres un profesor experto en crear exámenes académicos rigurosos.

Basado en el siguiente contenido de un curso, genera un examen con {num_questions} preguntas.

CURSO: {course_title}
DESCRIPCIÓN: {course_description}

CONTENIDO DEL CURSO:
{content_section}

REGLAS:
1. El examen debe incluir diferentes tipos de pregunta: opción múltiple (al menos la mitad), verdadero/falso, y respuesta corta
2. Para opción múltiple: exactamente 4 opciones, una correcta
3. Para verdadero/falso: campo "options": ["Verdadero", "Falso"], correct_index 0 o 1
4. Para respuesta corta: campo "options" vacío [], correct_index -1
5. Organiza de menor a mayor dificultad
6. Responde SOLO con JSON válido

Formato de respuesta:
{{
  "title": "Examen - {course_title}",
  "description": "Examen sobre los temas cubiertos en el curso",
  "questions": [
    {{
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct_index": 0,
      "type": "multiple_choice"
    }}
  ]
}}

Genera el examen ahora:""",

            "assignment": f"""Eres un profesor experto en crear tareas y proyectos prácticos.

Basado en el siguiente contenido de un curso, genera una tarea práctica con instrucciones claras.

CURSO: {course_title}
DESCRIPCIÓN: {course_description}

CONTENIDO DEL CURSO:
{content_section}

REGLAS:
1. La tarea debe ser práctica y aplicable
2. Incluye objetivos de aprendizaje claros
3. Define criterios de evaluación específicos
4. Proporciona instrucciones paso a paso
5. Responde SOLO con JSON válido

Formato de respuesta:
{{
  "title": "Tarea - {course_title}",
  "description": "Descripción de la tarea",
  "instructions": "Instrucciones paso a paso...",
  "objectives": ["Objetivo 1", "Objetivo 2"],
  "criteria": ["Criterio 1", "Criterio 2"]
}}

Genera la tarea ahora:"""
        }

        prompt = prompts.get(activity_type, prompts["quiz"])

        response = self.model.generate_content(prompt)
        text = response.text.strip()

        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        result = json.loads(text)

        if activity_type in ["quiz", "exam"] and "questions" in result:
            validated = []
            for q in result["questions"]:
                if "question" in q and "options" in q and "correct_index" in q:
                    if len(q["options"]) >= 2 and 0 <= q["correct_index"] < len(q["options"]):
                        validated.append({
                            "question": q["question"],
                            "options": q["options"],
                            "correct_index": q["correct_index"],
                            "type": q.get("type", "multiple_choice"),
                        })
            result["questions"] = validated[:num_questions]

        return result
