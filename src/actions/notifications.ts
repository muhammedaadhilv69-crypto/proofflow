"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedContext } from "@/lib/authz";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/data";

export async function markAsRead(notificationId: string) {
  const context = await requireAuthenticatedContext();
  await markNotificationRead(context, notificationId);
  revalidatePath("/activity");
}

export async function markAllAsRead() {
  const context = await requireAuthenticatedContext();
  await markAllNotificationsRead(context);
  revalidatePath("/activity");
}