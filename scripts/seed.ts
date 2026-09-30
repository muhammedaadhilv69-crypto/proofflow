import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/app-url";
import { reviewPath } from "@/lib/routes";

const admin = createAdminClient();
const email = process.env.SEED_DEMO_EMAIL;
const password = process.env.SEED_DEMO_PASSWORD;
const workspaceName = process.env.SEED_DEMO_WORKSPACE || "A Mad Dev";
const printReviewLink = process.env.SEED_DEMO_PRINT_REVIEW_LINK === "true";

if (!email || !password)
  throw new Error(
    "Set SEED_DEMO_EMAIL and SEED_DEMO_PASSWORD before running the seed",
  );
const seedEmail = email;
const seedPassword = password;

async function findOrCreateUser() {
  const created = await admin.auth.admin.createUser({
    email: seedEmail,
    password: seedPassword,
    email_confirm: true,
    user_metadata: { full_name: "Aadhil" },
  });
  if (created.data.user) return created.data.user;
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = listed.data.users.find(
    (candidate) => candidate.email?.toLowerCase() === seedEmail.toLowerCase(),
  );
  if (!user) throw new Error("Could not find or create the demo user");
  return user;
}

function data<T>(value: unknown) {
  return value as T;
}

async function main() {
  const user = await findOrCreateUser();
  const provisioned = await admin.rpc("ensure_workspace_for_user", {
    p_user_id: user.id,
    p_workspace_name: workspaceName,
  });
  if (provisioned.error) throw provisioned.error;
  const workspaceId = data<{ id: string }>(provisioned.data).id;

  const existingClient = await admin
    .from("clients")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("email", "client@valacafe.test")
    .maybeSingle();
  const client = existingClient.data
    ? data<{ id: string }>(existingClient.data)
    : data<{ id: string }>(
        (
          await admin
            .from("clients")
            .insert({
              workspace_id: workspaceId,
              name: "Sarah Ahmed",
              email: "client@valacafe.test",
              company: "Vala Cafe",
            })
            .select("id")
            .single()
        ).data!,
      );
  const existingProject = await admin
    .from("projects")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", "Vala Cafe Website")
    .maybeSingle();
  if (existingProject.data) {
    console.log(`Demo project already exists in workspace ${workspaceId}`);
    return;
  }
  const project = data<{ id: string }>(
    (
      await admin
        .from("projects")
        .insert({
          workspace_id: workspaceId,
          client_id: client.id,
          name: "Vala Cafe Website",
          description: "A small website refresh for Vala Cafe.",
        })
        .select("id")
        .single()
    ).data!,
  );
  await admin
    .from("activity_events")
    .insert({
      workspace_id: workspaceId,
      project_id: project.id,
      actor_type: "AGENCY",
      actor_id: user.id,
      event_type: "PROJECT_CREATED",
      metadata: {},
    });

  async function addDeliverable(name: string, description: string) {
    const result = await admin
      .from("deliverables")
      .insert({
        workspace_id: workspaceId,
        project_id: project.id,
        name,
        description,
      })
      .select("id")
      .single();
    if (result.error) throw result.error;
    const deliverable = data<{ id: string }>(result.data);
    await admin
      .from("activity_events")
      .insert({
        workspace_id: workspaceId,
        project_id: project.id,
        deliverable_id: deliverable.id,
        actor_type: "AGENCY",
        actor_id: user.id,
        event_type: "DELIVERABLE_CREATED",
        metadata: {},
      });
    return deliverable;
  }

  async function uploadVersion(
    deliverableId: string,
    label: string,
    description: string,
  ) {
    const versionId = randomUUID();
    const fileId = randomUUID();
    const path = `workspace/${workspaceId}/project/${project.id}/deliverable/${deliverableId}/version/${versionId}/file.svg`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#f8fafc"/><rect x="60" y="60" width="1080" height="680" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/><text x="110" y="180" font-family="Arial" font-size="48" fill="#0f172a">${label}</text><text x="110" y="250" font-family="Arial" font-size="24" fill="#475569">ProofFlow demo deliverable</text><rect x="110" y="330" width="360" height="64" rx="12" fill="#2563eb"/><text x="290" y="372" text-anchor="middle" font-family="Arial" font-size="24" fill="#ffffff">Review version</text></svg>`;
    const upload = await admin.storage
      .from("proofflow-files")
      .upload(path, Buffer.from(svg), {
        contentType: "image/svg+xml",
        upsert: false,
      });
    if (upload.error) throw upload.error;
    const result = await admin.rpc("create_version", {
      p_workspace_id: workspaceId,
      p_project_id: project.id,
      p_deliverable_id: deliverableId,
      p_version_id: versionId,
      p_file_id: fileId,
      p_storage_path: path,
      p_original_filename: `${label.toLowerCase().replace(/\s+/g, "-")}.svg`,
      p_mime_type: "image/svg+xml",
      p_size_bytes: Buffer.byteLength(svg),
      p_description: description,
      p_uploaded_by: user.id,
    });
    if (result.error) throw result.error;
    return versionId;
  }

  async function reviewToken(versionId: string) {
    const result = await admin.rpc("create_review_token", {
      p_workspace_id: workspaceId,
      p_version_id: versionId,
      p_created_by: user.id,
    });
    if (result.error) throw result.error;
    return data<{ token: string }>(result.data).token;
  }

  const homepage = await addDeliverable(
    "Homepage",
    "The main landing page for Vala Cafe.",
  );
  const homepageV1 = await uploadVersion(
    homepage.id,
    "Homepage v1",
    "Initial homepage direction.",
  );
  const homepageV1Token = await reviewToken(homepageV1);
  await admin.rpc("add_review_comment", {
    p_token: homepageV1Token,
    p_body: "Can we make the primary call to action more prominent?",
    p_change_request: false,
    p_ip_address: undefined,
    p_user_agent: undefined,
  });
  await admin.rpc("add_review_comment", {
    p_token: homepageV1Token,
    p_body: "Please make the CTA larger and clarify the opening message.",
    p_change_request: true,
    p_ip_address: undefined,
    p_user_agent: undefined,
  });
  const homepageV2 = await uploadVersion(
    homepage.id,
    "Homepage v2",
    "CTA increased and opening message clarified.",
  );
  const homepageV2Token = await reviewToken(homepageV2);
  await admin.rpc("add_review_comment", {
    p_token: homepageV2Token,
    p_body:
      "The message is clearer. Please check the mobile spacing before approval.",
    p_change_request: true,
    p_ip_address: undefined,
    p_user_agent: undefined,
  });
  const homepageV3 = await uploadVersion(
    homepage.id,
    "Homepage v3",
    "Mobile spacing refined and final CTA treatment applied.",
  );
  await admin.rpc("approve_version", {
    p_token: await reviewToken(homepageV3),
    p_ip_address: undefined,
    p_user_agent: undefined,
  });

  const menu = await addDeliverable(
    "Menu",
    "The menu page and item presentation.",
  );
  const menuV1 = await uploadVersion(
    menu.id,
    "Menu v1",
    "Initial menu page direction.",
  );
  const menuToken = await reviewToken(menuV1);
  if (printReviewLink)
    console.log(`Demo Menu review link: ${getAppUrl()}${reviewPath(menuToken)}`);

  await addDeliverable("Contact", "Contact details and enquiry form.");
  console.log(`Seeded ProofFlow demo workspace ${workspaceId} for ${email}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
