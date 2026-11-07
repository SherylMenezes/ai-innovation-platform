// companyClient.js - Connects to Supabase / FastAPI backend with local fallback
import {
  mockCompany,
  mockStats,
  mockDepartments,
  mockFunnelStages,
  mockNeedsAttention,
  mockTopPerformers
} from "./mockData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const companyClient = {
  async getDashboardSummary(companyId) {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return { summary: mockStats, departments: mockDepartments, funnel: mockFunnelStages, topPerformers: mockTopPerformers, alerts: mockNeedsAttention };

      const res = await fetch(`${API_BASE_URL}/institution/${companyId}/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Backend query failed");
      return await res.json();
    } catch (err) {
      console.warn("Fallback to mock data:", err.message);
      return {
        summary: mockStats,
        departments: mockDepartments,
        funnel: mockFunnelStages,
        topPerformers: mockTopPerformers,
        alerts: mockNeedsAttention
      };
    }
  },

  async createDepartment(companyId, payload) {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No token, simulating browser state");

      const res = await fetch(`${API_BASE_URL}/institution/${companyId}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.warn("Local mock insertion:", err.message);
      return { id: Date.now(), ...payload };
    }
  }
};