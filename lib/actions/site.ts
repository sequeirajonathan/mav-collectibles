"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { ActionError, createAction } from "@lib/actions/safe-action";
import { refreshSearchIndex } from "@lib/data/catalog";
import { UserRole } from "@interfaces/roles";
import {
  communityInput,
  alertBannerInput,
  installerInput,
  setFlagInput,
  videoSettingsInput,
  youTubeSettingsInput,
} from "@lib/contracts/site";
import { tags } from "@lib/data/tags";
import { publicEnv } from "@lib/env";
import { SERVICE_KEYS, SERVICE_KEY_NAMES, checkGoogleKey, encryptServiceKey } from "@lib/service-keys";

const ADMIN = [UserRole.ADMIN] as const;

export const setFlag = createAction({ input: setFlagInput, access: ADMIN }, async ({ name, enabled }) => {
  await prisma.featureFlag.upsert({
    where: { name },
    create: { name, enabled },
    update: { enabled },
  });
  updateTag(tags.flags);
  return { name, enabled };
});

export const saveAlertBanner = createAction({ input: alertBannerInput, access: ADMIN }, async (input) => {
  const existing = await prisma.alertBanner.findFirst({ orderBy: { updatedAt: "desc" } });
  if (existing) await prisma.alertBanner.update({ where: { id: existing.id }, data: input });
  else await prisma.alertBanner.create({ data: { id: "1", ...input } });
  updateTag(tags.banner);
  return null;
});

export const saveYouTubeSettings = createAction({ input: youTubeSettingsInput, access: ADMIN }, async (input) => {
  await prisma.youTubeSettings.upsert({ where: { id: "1" }, create: { id: "1", ...input }, update: input });
  updateTag(tags.media);
  return null;
});

export const saveVideoSettings = createAction({ input: videoSettingsInput, access: ADMIN }, async (input) => {
  await prisma.videoSettings.upsert({ where: { id: 1 }, create: { id: 1, ...input }, update: input });
  updateTag(tags.media);
  return null;
});

export const addInstaller = createAction({ input: installerInput, access: ADMIN }, async ({ name, url }) => {
  const row = await prisma.installer.create({ data: { name, url, type: "github_release" } });
  updateTag(tags.installers);
  return { id: row.id };
});

export const deleteInstaller = createAction({ input: z.object({ id: z.string().min(1) }), access: ADMIN }, async ({ id }) => {
  await prisma.installer.delete({ where: { id } });
  updateTag(tags.installers);
  return null;
});

export const saveCommunity = createAction({ input: communityInput, access: ADMIN }, async ({ discordUrl }) => {
  await prisma.communitySettings.upsert({
    where: { id: 1 },
    create: { id: 1, discord_url: discordUrl },
    update: { discord_url: discordUrl },
  });
  updateTag(tags.community);
  return null;
});

/** Rebuild the search index now (it also refreshes itself once a day). */
export const refreshSearchIndexAction = createAction({ input: z.object({}), access: ADMIN }, async () => {
  try {
    const result = await refreshSearchIndex();
    updateTag(tags.catalog);
    return result;
  } catch (error) {
    throw new ActionError(error instanceof Error ? error.message : "The refresh failed.");
  }
});

/** ADMIN only: saves a service key. The value is encrypted and can't be read back in the admin screens. */
export const saveServiceKey = createAction(
  { input: z.object({ name: z.enum(SERVICE_KEY_NAMES), value: z.string().trim().min(1).max(400) }), access: [UserRole.ADMIN] },
  async ({ name, value }, admin) => {
    const service = SERVICE_KEYS[name];
    if (!service.pattern.test(value)) throw new ActionError(`That doesn't look like a ${service.label} key. ${service.hint}.`);
    const ciphertext = encryptServiceKey(value);
    await prisma.serviceKey.upsert({
      where: { name },
      create: { name, ciphertext, updated_by: admin.id },
      update: { ciphertext, updated_by: admin.id, updated_at: new Date() },
    });
    updateTag(tags.integrations);
    // Try the key straight away where we can, so a problem shows up now rather than as a silently empty page.
    const check = name === "GOOGLE_PLACES_API_KEY" ? await checkGoogleKey(value, publicEnv().NEXT_PUBLIC_GOOGLE_PLACE_ID) : null;
    return { check };
  }
);

/** ADMIN only: forgets a key saved here. */
export const removeServiceKey = createAction({ input: z.object({ name: z.enum(SERVICE_KEY_NAMES) }), access: [UserRole.ADMIN] }, async ({ name }) => {
  await prisma.serviceKey.deleteMany({ where: { name } });
  updateTag(tags.integrations);
  return null;
});
