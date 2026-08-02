import { prisma } from "@/lib/prisma";

export function getProjectById(projectId: string) {
  return prisma.project.findUnique({ where: { id: projectId } });
}
