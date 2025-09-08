"use client";
import { create } from "zustand";

type Event = {
  id: number;
  type: string;
  userId: number | null;
  sessionId: number | null;
  message: string;
  createdAt: string;
};

type Session = {
  id: number;
  familyId: number;
  userId: number;
  accessJti: string;
  accessExpiresAt: string;
  refreshLookupHash: string;
  refreshHash: string;
  refreshExpiresAt: string;
  userAgentHash: string | null;
  ipHash: string | null;
  createdAt: string;
  revokedAt: string | null;
};

type DashboardState = {
  userId: number | null;
  setUserId: (id: number | null) => void;
  sessions: Session[];
  events: Event[];
  setSessions: (s: Session[]) => void;
  setEvents: (e: Event[]) => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  userId: 1,
  setUserId: (id) => set({ userId: id }),
  sessions: [],
  events: [],
  setSessions: (s) => set({ sessions: s }),
  setEvents: (e) => set({ events: e }),
}));
