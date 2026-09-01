import { apiRequest } from "./core";
import type {
  CreateEquipmentInput,
  Equipment,
  UpdateEquipmentInput,
} from "@/types/equipment";
import type { PaginatedResult } from "@/types/pagination";

export interface ListEquipmentParams {
  search?: string;
  page?: number;
  limit?: number;
}

/** GET /equipment — accessible to any authenticated user (Employee or Admin). */
export function listEquipment(
  params?: ListEquipmentParams,
  cookieHeader?: string,
): Promise<PaginatedResult<Equipment>> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const queryString = query.toString();

  return apiRequest<PaginatedResult<Equipment>>(
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
