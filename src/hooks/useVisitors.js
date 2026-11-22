import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";

const REFRESH_MS = 30_000;

// Admin visitor list, refreshed every 30 seconds.
export function useVisitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const changes = useRef(0);

  const refresh = useCallback(async () => {
    const before = changes.current;
    try {
      const data = await apiFetch("/api/visitor/all", { auth: true });
      // Drop a list that was requested before an approve/reject finished.
      if (before === changes.current) setVisitors(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id, status, message) => {
    const updated = await apiFetch(`/api/visitor/update/${id}`, {
      method: "PUT",
      body: { status, message },
      auth: true,
    });
    changes.current += 1;
    setVisitors((list) => list.map((v) => (v._id === id ? updated : v)));
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh]);

  return { visitors, loading, error, refresh, updateStatus };
}
