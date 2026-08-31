import { apiRequest } from "./core";
import type { Equipment, PaginatedResult } from "@/types/equipment";

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
