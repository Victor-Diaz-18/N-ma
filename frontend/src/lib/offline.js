import { openDB } from "idb";

const DB_NAME = "numa-offline";
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      if (!db.objectStoreNames.contains("api_cache")) {
        const s = db.createObjectStore("api_cache", { keyPath: "key" });
        s.createIndex("ts", "ts");
      }
      if (!db.objectStoreNames.contains("pending_submissions")) {
        db.createObjectStore("pending_submissions", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("offline_files")) {
        db.createObjectStore("offline_files", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("downloaded_courses")) {
        db.createObjectStore("downloaded_courses", { keyPath: "id" });
      }
    },
  });
}

// Cache a successful API GET response
export async function cacheApiResponse(key, data) {
  const db = await getDB();
  await db.put("api_cache", { key, data, ts: Date.now() });
}

export async function readApiCache(key) {
  const db = await getDB();
  const row = await db.get("api_cache", key);
  return row?.data;
}

// Submission queue
export async function queueSubmission(payload) {
  const db = await getDB();
  return db.add("pending_submissions", { ...payload, queued_at: Date.now() });
}

export async function listPendingSubmissions() {
  const db = await getDB();
  return db.getAll("pending_submissions");
}

export async function removePendingSubmission(id) {
  const db = await getDB();
  return db.delete("pending_submissions", id);
}

// Offline file marker (registry so UI can show "available offline")
export async function markFileOffline(fileId, meta = {}) {
  const db = await getDB();
  await db.put("offline_files", { id: fileId, ...meta, saved_at: Date.now() });
}

export async function isFileOffline(fileId) {
  const db = await getDB();
  const row = await db.get("offline_files", fileId);
  return !!row;
}

// Mark a course as "downloaded for offline"
export async function markCourseOffline(courseId, meta = {}) {
  const db = await getDB();
  await db.put("downloaded_courses", { id: courseId, ...meta, saved_at: Date.now() });
}

export async function isCourseOffline(courseId) {
  const db = await getDB();
  const row = await db.get("downloaded_courses", courseId);
  return !!row;
}

export async function listOfflineCourses() {
  const db = await getDB();
  return db.getAll("downloaded_courses");
}

// Tell the service worker to pre-cache a file URL
export function precacheFile(url) {
  if (!navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: "PRECACHE_FILE", url });
}
