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
