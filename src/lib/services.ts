import servicesData from "@/data/services.json";
import type { StreamingService } from "@/types";

const services: StreamingService[] = servicesData as StreamingService[];

export const getAllServices = (): StreamingService[] => services;

export const getServiceById = (id: string): StreamingService | undefined =>
  services.find((s) => s.id === id);

export const matchProvidersToServices = (
  providerIds: number[]
): StreamingService[] =>
  services.filter((s) => s.tmdbIds.some((id) => providerIds.includes(id)));

export const getAvailableServices = (
  userServices: string[],
  providerIds: number[]
): string[] => {
  const matched = matchProvidersToServices(providerIds);
  return matched
    .map((s) => s.id)
    .filter((id) => userServices.includes(id));
};
