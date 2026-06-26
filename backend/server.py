from dotenv import load_dotenv
from pathlib import Path
import os

# Load .env file if it exists (for local development)
# In Vercel, environment variables are set in the dashboard
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

import os
import uuid
import logging
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from config import get_settings
from services.auth_service import AuthService
from services.gamification_service import GamificationService
from services.file_service import FileService
from services.course_service import CourseService
from middleware.error_handler import setup_error_handlers
from middleware.rate_limiter import setup_rate_limiter, limiter
from routes.auth_routes import router as auth_router
from routes.course_routes import router as course_router
from routes.activity_routes import router as activity_router
from routes.gamification_routes import router as gamification_router
from routes.file_routes import router as file_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("numa")

settings = get_settings()

app = FastAPI(title="NUMA API", docs_url="/docs", redoc_url="/redoc")

setup_error_handlers(app)
setup_rate_limiter(app)

client = AsyncIOMotorClient(settings.mongo_url)
db = client[settings.db_name]

auth_service = AuthService(db)
gamification_service = GamificationService(db)
file_service = FileService(db)
course_service = CourseService(db, gamification_service)

app.state.db = db
app.state.auth_service = auth_service
app.state.gamification_service = gamification_service
app.state.file_service = file_service
app.state.course_service = course_service

app.include_router(auth_router)
app.include_router(course_router)
app.include_router(activity_router)
app.include_router(gamification_router)
app.include_router(file_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed_sample_course(db, teacher_id: str):
    existing = await db.courses.find_one({"teacher_id": teacher_id, "title": "Plantas Medicinales 101"})
    if existing:
        return

    course_id = str(uuid.uuid4())
    await db.courses.insert_one({
        "id": course_id,
        "title": "Plantas Medicinales 101",
        "description": "Introducción al mundo de las plantas medicinales, sus principios activos y aplicaciones terapéuticas tradicionales.",
        "subject": "Botánica",
        "cover_color": "#8BC34A",
        "teacher_id": teacher_id,
        "teacher_name": "NUMA",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    lessons = [
        {"title": "¿Qué son las plantas medicinales?",
         "content": "# Bienvenido a NUMA\n\nLas **plantas medicinales** son aquellas que contienen principios activos con efectos terapéuticos sobre el organismo.\n\n## Ejemplos clásicos\n\n- **Manzanilla** (*Matricaria chamomilla*): digestiva y relajante\n- **Tilo** (*Tilia platyphyllos*): ansiolítico suave\n- **Equinácea** (*Echinacea purpurea*): inmunoestimulante\n- **Caléndula** (*Calendula officinalis*): cicatrizante tópica\n\n> El uso de hierbas con fines medicinales se remonta a más de 60.000 años.",
         "order": 1},
        {"title": "Principios activos y modos de extracción",
         "content": "## Principios activos comunes\n\n1. **Alcaloides** — efectos potentes sobre SNC (ej. cafeína)\n2. **Flavonoides** — antioxidantes (ej. quercetina)\n3. **Aceites esenciales** — aromáticos y antimicrobianos\n4. **Taninos** — astringentes (ej. corteza de roble)\n\n## Métodos de preparación\n\n- **Infusión**: hojas y flores en agua caliente sin hervir\n- **Decocción**: raíces y cortezas hervidas 10-15 min\n- **Tintura**: maceración en alcohol 30-40°\n- **Cataplasma**: aplicación tópica de planta machacada",
         "order": 2},
        {"title": "Buenas prácticas y precauciones",
         "content": "## Antes de usar cualquier planta\n\n- **Consulta** a un profesional de salud si tomas medicamentos\n- Verifica **identificación botánica** correcta\n- Empieza con **dosis bajas** para detectar alergias\n- Embarazadas y niños requieren **atención especial**\n\n## Plantas con interacciones conocidas\n\n| Planta | Interacción |\n|--------|-------------|\n| Hierba de San Juan | Antidepresivos, anticonceptivos |\n| Ginkgo | Anticoagulantes |\n| Regaliz | Hipertensión |",
         "order": 3},
    ]

    for l in lessons:
        await db.lessons.insert_one({
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "title": l["title"],
            "content": l["content"],
            "order": l["order"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    resources = [
        {"title": "Atlas de plantas medicinales (OMS)", "type": "link",
         "url": "https://www.who.int/medicines/areas/traditional/en/", "description": "Monografías oficiales de la OMS"},
        {"title": "Guía visual de hojas y flores", "type": "link",
         "url": "https://es.wikipedia.org/wiki/Planta_medicinal", "description": "Referencia general en Wikipedia"},
    ]

    for r in resources:
        await db.resources.insert_one({
            "id": str(uuid.uuid4()),
            "course_id": course_id,
            "title": r["title"],
            "type": r["type"],
            "url": r.get("url"),
            "file_id": None,
            "description": r.get("description", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    await db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "title": "Quiz: Conoce tus hierbas",
        "description": "Pon a prueba lo aprendido sobre plantas medicinales básicas.",
        "type": "quiz",
        "due_date": None,
        "max_points": 100,
        "xp_reward": 80,
        "quiz_questions": [
            {"question": "¿Qué planta es conocida por su efecto digestivo y relajante?",
             "options": ["Equinácea", "Manzanilla", "Caléndula", "Romero"], "correct_index": 1},
            {"question": "¿Qué método se usa típicamente para extraer principios activos de raíces y cortezas?",
             "options": ["Infusión", "Tintura", "Decocción", "Cataplasma"], "correct_index": 2},
            {"question": "¿Qué tipo de principio activo es la cafeína?",
             "options": ["Flavonoide", "Tanino", "Aceite esencial", "Alcaloide"], "correct_index": 3},
            {"question": "¿Qué planta puede interactuar con anticoagulantes?",
             "options": ["Tilo", "Ginkgo", "Manzanilla", "Caléndula"], "correct_index": 1},
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    await db.activities.insert_one({
        "id": str(uuid.uuid4()),
        "course_id": course_id,
        "title": "Tarea: Mi botiquín verde",
        "description": "Investiga y describe 3 plantas medicinales que crezcan en tu región. Para cada una indica: nombre común y científico, principal uso terapéutico, y forma de preparación recomendada. Adjunta una foto si puedes.",
        "type": "assignment",
        "due_date": None,
        "max_points": 100,
        "xp_reward": 120,
        "quiz_questions": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.courses.create_index("id", unique=True)
    await db.enrollments.create_index([("course_id", 1), ("student_id", 1)], unique=True)
    await db.user_badges.create_index([("user_id", 1), ("badge_id", 1)], unique=True)

    existing = await db.users.find_one({"email": settings.admin_email})
    if not existing:
        admin_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": admin_id,
            "email": settings.admin_email,
            "name": "NUMA",
            "password_hash": auth_service.hash_password(settings.admin_password),
            "role": "teacher",
            "xp": 0,
            "level": 1,
            "avatar_color": "#8BC34A",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        existing = {"id": admin_id}
    await seed_sample_course(db, existing["id"])
    logger.info("NUMA startup complete")


@app.on_event("shutdown")
async def shutdown():
    client.close()
