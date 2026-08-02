import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { slug: "demo-project" },
    update: {
      name: "Demo Project",
      description: "A small seeded project for the human-approved alpha workflow.",
      status: "ACTIVE",
    },
    create: {
      name: "Demo Project",
      slug: "demo-project",
      description: "A small seeded project for the human-approved alpha workflow.",
      status: "ACTIVE",
    },
  });

  const agents = [
    { name: "Planner", role: "PLANNER" },
    { name: "Developer", role: "DEVELOPER" },
    { name: "QA", role: "QA" },
  ];

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { projectId_role: { projectId: project.id, role: agent.role } },
      update: { name: agent.name, status: "AVAILABLE" },
      create: { ...agent, projectId: project.id, status: "AVAILABLE" },
    });
  }

  const auditCount = await prisma.auditEvent.count({
    where: { projectId: project.id },
  });

  if (auditCount === 0) {
    await prisma.auditEvent.create({
      data: {
        projectId: project.id,
        actorName: "System Seed",
        event: "DEMO_PROJECT_READY",
        objectType: "Project",
        objectId: project.id,
        newState: "ACTIVE",
        evidence: "Seed created a self-contained Demo Project with Planner, Developer, and QA agents.",
      },
    });
  }

  console.log(`Demo Project ready: ${project.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
