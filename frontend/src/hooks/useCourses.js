import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/courses/mine");
      setCourses(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar cursos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return { courses, loading, error, reload: loadCourses };
}

export function useCourse(courseId) {
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [resources, setResources] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError(null);
      const [c, ls, rs, as] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/lessons`),
        api.get(`/courses/${courseId}/resources`),
        api.get(`/courses/${courseId}/activities`),
      ]);
      setCourse(c.data);
      setLessons(ls.data);
      setResources(rs.data);
      setActivities(as.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar el curso");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  return {
    course,
    lessons,
    resources,
    activities,
    loading,
    error,
    reload: loadCourse,
  };
}
