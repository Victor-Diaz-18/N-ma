import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/me/stats");
      setStats(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, reload: loadStats };
}

export function useUpcoming() {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/me/upcoming");
      setUpcoming(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar actividades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  return { upcoming, loading, error, reload: loadUpcoming };
}

export function useLeaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/leaderboard");
      setRows(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar ranking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return { rows, loading, error, reload: loadLeaderboard };
}

export function useSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/me/submissions");
      setSubmissions(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Error al cargar entregas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  return { submissions, loading, error, reload: loadSubmissions };
}
