"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedContext } from "@/lib/authz";
import {
  clientSchema,
  deliverableSchema,
  projectEditSchema,
  projectSchema,
} from "@/lib/validation";
import { trackEvent } from "@/lib/analytics";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function failure(error: string) {
  return { success: false as const, error };
}

export async function createClientAction(formData: FormData) {
  const parsed = clientSchema.safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    company: text(formData, "company"),
  });
  if (!parsed.success)
    return failure(
      parsed.error.issues[0]?.message || "Check the client details",
    );
  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");

  const { data, error } = await context.supabase
    .from("clients")
    .insert({
      workspace_id: context.workspaceId,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      company: parsed.data.company || null,
    })
    .select("id")
    .single();
  if (error) return failure(error.message);

  await trackEvent("client_created", {
    workspace_id: context.workspaceId,
    client_id: data.id,
  });
  revalidatePath("/clients");
  return { success: true as const, id: data.id };
}

export async function updateClientAction(formData: FormData) {
  const parsed = clientSchema.safeParse({
    name: text(formData, "name"),
    email: text(formData, "email"),
    company: text(formData, "company"),
  });
  if (!parsed.success)
    return failure(
      parsed.error.issues[0]?.message || "Check the client details",
    );
  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  const clientId = text(formData, "clientId");
  const { error } = await context.supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      company: parsed.data.company || null,
    })
    .eq("id", clientId)
    .eq("workspace_id", context.workspaceId);
  if (error) return failure(error.message);
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true as const };
}

export async function createProjectAction(formData: FormData) {
  const parsed = projectSchema.safeParse({
    name: text(formData, "name"),
    clientId: text(formData, "clientId"),
    description: text(formData, "description"),
    dueDate: text(formData, "dueDate"),
  });
  if (!parsed.success)
    return failure(
      parsed.error.issues[0]?.message || "Check the project details",
    );
  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");

  const { data: client } = await context.supabase
    .from("clients")
    .select("id")
    .eq("id", parsed.data.clientId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!client) return failure("Choose a client from this workspace");

  const { data, error } = await context.supabase
    .from("projects")
    .insert({
      workspace_id: context.workspaceId,
      client_id: parsed.data.clientId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate || null,
    })
    .select("id")
    .single();
  if (error) return failure(error.message);

  await context.admin
    .from("activity_events")
    .insert({
      workspace_id: context.workspaceId,
      project_id: data.id,
      actor_type: "AGENCY",
      actor_id: context.user.id,
      event_type: "PROJECT_CREATED",
      metadata: {},
    });
  await trackEvent("project_created", {
    workspace_id: context.workspaceId,
    project_id: data.id,
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true as const, id: data.id };
}

export async function updateProjectDetailsAction(formData: FormData) {
  const parsed = projectEditSchema.safeParse({
    name: text(formData, "name"),
    description: text(formData, "description"),
    dueDate: text(formData, "dueDate"),
  });
  if (!parsed.success)
    return failure(
      parsed.error.issues[0]?.message || "Check the project details",
    );
  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  const projectId = text(formData, "projectId");
  const { data: project } = await context.supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!project) return failure("Project not found");
  const { error } = await context.supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      due_date: parsed.data.dueDate || null,
    })
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId);
  if (error) return failure(error.message);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true as const };
}

export async function updateProjectAction(formData: FormData) {
  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  const projectId = text(formData, "projectId");
  const status = text(formData, "status");
  if (!projectId || !["ACTIVE", "COMPLETED", "ARCHIVED"].includes(status))
    return failure("Invalid project status");

  const { data: project } = await context.supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!project) return failure("Project not found");
  const { error } = await context.supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId);
  if (error) return failure(error.message);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true as const };
}

export async function updateWorkspaceAction(formData: FormData) {
  const name = text(formData, "name").trim();
  if (name.length < 2 || name.length > 120)
    return failure("Workspace name must be between 2 and 120 characters");
  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  if (context.role !== "OWNER")
    return failure("Only workspace owners can update settings");
  const { error } = await context.supabase
    .from("workspaces")
    .update({ name })
    .eq("id", context.workspaceId);
  if (error) return failure(error.message);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function createDeliverableAction(formData: FormData) {
  const parsed = deliverableSchema.safeParse({
    name: text(formData, "name"),
    description: text(formData, "description"),
  });
  if (!parsed.success)
    return failure(
      parsed.error.issues[0]?.message || "Check the deliverable details",
    );
  const context = await getAuthenticatedContext(text(formData, "workspaceId"));
  if (!context) return failure("You must be signed in");
  const projectId = text(formData, "projectId");
  const { data: project } = await context.supabase
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .eq("workspace_id", context.workspaceId)
    .maybeSingle();
  if (!project) return failure("Project not found");
  if (project.status === "ARCHIVED")
    return failure("Archived projects cannot receive new deliverables");

  const { data, error } = await context.supabase
    .from("deliverables")
    .insert({
      workspace_id: context.workspaceId,
      project_id: projectId,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();
  if (error) return failure(error.message);

  await context.admin
    .from("activity_events")
    .insert({
      workspace_id: context.workspaceId,
      project_id: projectId,
      deliverable_id: data.id,
      actor_type: "AGENCY",
      actor_id: context.user.id,
      event_type: "DELIVERABLE_CREATED",
      metadata: {},
    });
  await trackEvent("deliverable_created", {
    workspace_id: context.workspaceId,
    deliverable_id: data.id,
  });
  revalidatePath(`/projects/${projectId}`);
  return { success: true as const, id: data.id };
}
