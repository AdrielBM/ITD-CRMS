"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserAccess } from "@/lib/auth/permissions";

const WORKFLOW_STEPS = [
  { step: 0, role: "Coordinator" },
  { step: 1, role: "Records" },
  { step: 2, role: "Secretary" },
  { step: 3, role: "Chair" },
];

/**
 * Faculty creates or updates a draft submission for an assignment.
 */
export async function createSubmission(formData) {
  const supabase = await createClient();
  const { user } = await getCurrentUserAccess(supabase);
  if (!user) throw new Error("Not authenticated");

  const assignmentId = parseInt(formData.get("assignment_id"));

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("assignment_id", assignmentId)
    .single();

  if (existing) return { submissionId: existing.id };

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      assignment_id: assignmentId,
      status: "draft",
      current_step: 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { submissionId: data.id };
}

/**
 * Faculty submits a requirement (moves from draft/needs_revision → submitted).
 * Uploads files to Supabase Storage, creates version, records metadata.
 */
export async function submitRequirement(formData) {
  const supabase = await createClient();
  const { user } = await getCurrentUserAccess(supabase);
  if (!user) throw new Error("Not authenticated");

  const submissionId = parseInt(formData.get("submission_id"));
  const notes = formData.get("notes") || null;

  // Fetch current submission to verify state
  const { data: sub, error: fetchError } = await supabase
    .from("submissions")
    .select("id, status, current_step, created_by, assignment_id")
    .eq("id", submissionId)
    .single();

  if (fetchError) throw new Error("Submission not found");
  if (sub.created_by !== user.id) throw new Error("Not your submission");
  if (sub.status !== "draft" && sub.status !== "needs_revision") {
    throw new Error(`Cannot submit: status is "${sub.status}"`);
  }

  // Determine next version number
  const { data: versions } = await supabase
    .from("submission_versions")
    .select("version_number")
    .eq("submission_id", submissionId)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version_number ?? 0) + 1;

  // Create version record
  const { data: version, error: verError } = await supabase
    .from("submission_versions")
    .insert({
      submission_id: submissionId,
      version_number: nextVersion,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (verError) throw new Error(verError.message);

  // Handle file uploads to Supabase Storage
  const uploadedFiles = formData.getAll("files");
  const fileRows = [];

  for (const file of uploadedFiles) {
    if (!(file instanceof File) || !file.name || file.size === 0) continue;

    // Build storage path: {userId}/{submissionId}/v{version}/{filename}
    const storagePath = `${user.id}/${submissionId}/v${nextVersion}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Try folder-based path as fallback
      const altPath = `faculty/${user.id}/${submissionId}/v${nextVersion}/${file.name}`;
      const { error: altError } = await supabase.storage
        .from("submissions")
        .upload(altPath, file, { contentType: file.type });

      if (altError) throw new Error(`Upload failed: ${altError.message}`);
      fileRows.push({
        submission_version_id: version.id,
        file_name: file.name,
        file_url: null,
        file_type: file.type || null,
        file_size: file.size,
        storage_path: altPath,
      });
    } else {
      fileRows.push({
        submission_version_id: version.id,
        file_name: file.name,
        file_url: null,
        file_type: file.type || null,
        file_size: file.size,
        storage_path,
      });
    }
  }

  // Insert file metadata
  if (fileRows.length > 0) {
    const { error: fileError } = await supabase
      .from("submission_files")
      .insert(fileRows);

    if (fileError) throw new Error(fileError.message);
  }

  // Update submission status to submitted
  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/submissions");
  revalidatePath("/submissions/review");
  return { success: true, version: nextVersion, files: fileRows.length };
}

/**
 * Reviewer approves at the current workflow step.
 * Advances current_step by 1. If step 3 → status becomes 'completed'.
 */
export async function approveSubmission(formData) {
  const supabase = await createClient();
  const { user, role } = await getCurrentUserAccess(supabase);
  if (!user) throw new Error("Not authenticated");

  const submissionId = parseInt(formData.get("submission_id"));
  const remarks = formData.get("remarks") || null;

  const { data: sub, error: fetchError } = await supabase
    .from("submissions")
    .select("id, status, current_step")
    .eq("id", submissionId)
    .single();

  if (fetchError) throw new Error("Submission not found");
  if (sub.status !== "submitted") throw new Error(`Cannot approve: status is "${sub.status}"`);

  const stepDef = WORKFLOW_STEPS[sub.current_step];
  if (!stepDef) throw new Error("No workflow step defined");
  if (stepDef.role !== role) throw new Error(`Only ${stepDef.role} can approve at this step`);

  const nextStep = sub.current_step + 1;
  const newStatus = nextStep >= 4 ? "completed" : "submitted";

  // Record the approval
  const { error: appError } = await supabase.from("approvals").insert({
    submission_id: submissionId,
    step_number: sub.current_step,
    step_role: role,
    reviewer_id: user.id,
    status: "approved",
    remarks,
  });

  if (appError) throw new Error(appError.message);

  // Advance step
  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      status: newStatus,
      current_step: nextStep,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/submissions");
  revalidatePath("/submissions/review");
  return { success: true, newStatus };
}

/**
 * Reviewer rejects at the current step. Status → 'needs_revision'.
 * Faculty must resubmit to be reviewed again at the same step.
 */
export async function rejectSubmission(formData) {
  const supabase = await createClient();
  const { user, role } = await getCurrentUserAccess(supabase);
  if (!user) throw new Error("Not authenticated");

  const submissionId = parseInt(formData.get("submission_id"));
  const remarks = formData.get("remarks");
  if (!remarks) throw new Error("Remarks are required when rejecting");

  const { data: sub, error: fetchError } = await supabase
    .from("submissions")
    .select("id, status, current_step")
    .eq("id", submissionId)
    .single();

  if (fetchError) throw new Error("Submission not found");
  if (sub.status !== "submitted") throw new Error(`Cannot reject: status is "${sub.status}"`);

  const stepDef = WORKFLOW_STEPS[sub.current_step];
  if (!stepDef) throw new Error("No workflow step defined");
  if (stepDef.role !== role) throw new Error(`Only ${stepDef.role} can reject at this step`);

  // Record the rejection
  const { error: appError } = await supabase.from("approvals").insert({
    submission_id: submissionId,
    step_number: sub.current_step,
    step_role: role,
    reviewer_id: user.id,
    status: "rejected",
    remarks,
  });

  if (appError) throw new Error(appError.message);

  // Set status to needs_revision — step stays the same
  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      status: "needs_revision",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/submissions");
  revalidatePath("/submissions/review");
  return { success: true };
}

/**
 * Generate a signed URL for a stored file (valid for 1 hour).
 */
export async function getFileDownloadUrl(storagePath) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("submissions")
    .createSignedUrl(storagePath, 3600);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
