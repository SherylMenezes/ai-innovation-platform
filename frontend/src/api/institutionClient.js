import { authenticatedRequest } from "./apiClient";
import {
  mockDashboard,
  mockGroupOptions,
  mockGroupStudents,
  mockGroupSummary,
} from "../pages/institute/institutionMockData";

// Keep this true until the /api/institution endpoints exist on the backend.
// When Riya's router is live, set it to false and nothing else needs to change.
export const USE_MOCK_INSTITUTION_DATA = true;

const fakeLatency = (data) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), 250));

const withGroup = (groupId) =>
  groupId ? `?group_id=${encodeURIComponent(groupId)}` : "";

/**
 * GET /api/institution/dashboard?group_id=
 * Response:
 * {
 *   institution_name, invite_code,
 *   stats: { total_students, active_now, active_assignments, due_this_week,
 *            completion_percent, completion_change, avg_ai_score },
 *   funnel: { assignment_title, group_name, student_count,
 *             stages: [{ key, label, count }] },
 *   attention: [{ id, severity: "high" | "medium" | "info", title, detail,
 *                 action_label, action_section }],
 *   top_students: [{ id, name, section, title, total_xp }]
 * }
 */
export function getInstitutionDashboard(token, groupId) {
  if (USE_MOCK_INSTITUTION_DATA) return fakeLatency(mockDashboard(groupId));
  return authenticatedRequest(`/api/institution/dashboard${withGroup(groupId)}`, { token });
}

/**
 * GET /api/institution/groups/summary?parent_id=
 * No parent_id returns the top level (grades or departments).
 * Response:
 * { level_label: "Grade",
 *   groups: [{ id, name, student_count, completion_percent, avg_ai_score,
 *              avg_xp, has_children }] }
 */
export function getGroupSummary(token, parentId) {
  if (USE_MOCK_INSTITUTION_DATA) return fakeLatency(mockGroupSummary(parentId));
  const query = parentId ? `?parent_id=${encodeURIComponent(parentId)}` : "";
  return authenticatedRequest(`/api/institution/groups/summary${query}`, { token });
}

/**
 * GET /api/institution/groups/{id}/students
 * Response:
 * { students: [{ id, name, completion_percent, avg_ai_score, avg_xp }] }
 */
export function getGroupStudents(token, groupId) {
  if (USE_MOCK_INSTITUTION_DATA) return fakeLatency(mockGroupStudents(groupId));
  return authenticatedRequest(
    `/api/institution/groups/${encodeURIComponent(groupId)}/students`,
    { token },
  );
}

/**
 * GET /api/institution/groups
 * Flat list for the class filter, parents before their children.
 * Response: { groups: [{ id, name, depth, has_children }] }
 */
export function getGroupOptions(token) {
  if (USE_MOCK_INSTITUTION_DATA) return fakeLatency(mockGroupOptions());
  return authenticatedRequest("/api/institution/groups", { token });
}
