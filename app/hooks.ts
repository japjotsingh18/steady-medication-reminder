"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardData, fallbackData } from "./types";
import { getLocalPhotoDoseIds } from "./local-photos";

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(fallbackData);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (response.ok) {
        const dashboard = await response.json() as DashboardData;
        const localPhotoIds = await getLocalPhotoDoseIds().catch(() => new Set<number>());
        setData({ ...dashboard, doses: dashboard.doses.map((dose) => localPhotoIds.has(dose.id) ? { ...dose, photoKey: `local:${dose.id}` } : dose) });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, setData, loading, refresh };
}
