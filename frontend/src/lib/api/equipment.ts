import { apiRequest } from "./core";
import type {
  CreateEquipmentInput,
  Equipment,
  EquipmentWithAvailability,
  UpdateEquipmentInput,
} from "@/types/equipment";
import type { PaginatedResult } from "@/types/pagination";

export interface ListEquipmentParams {
  search?: string;
  page?: number;
  limit?: number;
  /** Both required together — narrows results to equipment available for
   * this exact window (see EquipmentWithAvailability). Omit both to browse
   * normally. */
  startTime?: string;
  endTime?: string;
  /**
   * Fetch exactly this set of equipment by id, bypassing search — for
   * resolving names for a known set of ids (e.g. the equipment referenced
   * by a page of reservations) rather than browsing the catalogue. See
   * `lib/api/reservations.ts` usage.
   */
  ids?: string[];
}

/** GET /equipment — accessible to any authenticated user (Employee or Admin). */
export function listEquipment(
  params?: ListEquipmentParams,
  cookieHeader?: string,
): Promise<PaginatedResult<EquipmentWithAvailability>> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.startTime) query.set("startTime", params.startTime);
  if (params?.endTime) query.set("endTime", params.endTime);
  for (const id of params?.ids ?? []) {
    query.append("ids", id);
  }
  const queryString = query.toString();

  return apiRequest<PaginatedResult<EquipmentWithAvailability>>(
    `/equipment${queryString ? `?${queryString}` : ""}`,
    { cookieHeader },
  );
}

/** GET /equipment/:id — accessible to any authenticated user. */
export function getEquipment(id: string, cookieHeader?: string): Promise<Equipment> {
  return apiRequest<Equipment>(`/equipment/${id}`, { cookieHeader });
}

/** POST /equipment — Admin/SuperAdmin only; the backend re-enforces this regardless of who calls it. */
export function createEquipment(input: CreateEquipmentInput): Promise<Equipment> {
  return apiRequest<Equipment>("/equipment", { method: "POST", body: input });
}

/** PATCH /equipment/:id — Admin/SuperAdmin only. */
export function updateEquipment(id: string, input: UpdateEquipmentInput): Promise<Equipment> {
  return apiRequest<Equipment>(`/equipment/${id}`, { method: "PATCH", body: input });
}

/** DELETE /equipment/:id — Admin/SuperAdmin only. 204 No Content on success. */
export function deleteEquipment(id: string): Promise<void> {
  return apiRequest<void>(`/equipment/${id}`, { method: "DELETE" });
}
