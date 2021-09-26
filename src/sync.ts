import { GuildMember, Snowflake } from 'discord.js'
import prisma from './prisma'
import hypixel from './hypixel'
import { getBedwarsLevelInfo } from '@zikeji/hypixel'
import { calculateBedWarsLevel } from './utils/hypixel'

export default async function syncGuildMember(
  member: GuildMember
): Promise<void> {
  return

  // if (member.user.bot) return
  //
  // const user = await prisma.user.findUnique({
  //   where: {
  //     discordId: member.id,
  //   },
  //   select: {
  //     minecraftId: true,
  //   },
  // })
  //
  // const guild = await prisma.discordGuild.findUnique({
  //   where: {
  //     id: member.guild.id,
  //   },
  //   select: {
  //     linkedRoleId: true,
  //     levelRoles: {
  //       select: {
  //         id: true,
  //         level: true,
  //       },
  //       orderBy: {
  //         level: 'desc',
  //       },
  //     },
  //   },
  // })
  //
  // if (!user || !user.minecraftId) {
  //   if (member.nickname !== null) {
  //     await member.setNickname(null).catch(() => {})
  //   }
  //
  //   if (!guild) return
  //
  //   if (
  //     guild.linkedRoleId &&
  //     member.roles.cache.has(guild.linkedRoleId as Snowflake)
  //   ) {
  //     await member.roles.remove(guild.linkedRoleId)
  //   }
  //
  //   await member.roles.remove(
  //     guild.levelRoles
  //       .filter((levelRole) =>
  //         member.roles.cache.has(levelRole.id as Snowflake)
  //       )
  //       .map((levelRole) => levelRole.id)
  //   )
  // } else {
  //   const player = await hypixel.player.uuid(user.minecraftId)
  //
  //   const level = calculateBedWarsLevel(
  //     player.stats.Bedwars?.Experience ||
  //       player.stats.Bedwars?.Experience_new ||
  //       0
  //   )
  //
  //   const finalKillDeathRatio =
  //     (player.stats.Bedwars?.final_kills_bedwars || 0) /
  //     (player.stats.Bedwars?.final_deaths_bedwars || 1)
  //
  //   const nickname = `[${Math.floor(level)}✫|${
  //     Math.floor(finalKillDeathRatio * 10) / 10
  //   }] ${player.displayname}`
  //
  //   if (member.nickname !== nickname) {
  //     await member.setNickname(nickname).catch(() => {})
  //   }
  //
  //   if (guild) {
  //     if (
  //       guild.linkedRoleId &&
  //       !member.roles.cache.has(guild.linkedRoleId as Snowflake)
  //     ) {
  //       await member.roles.add(guild.linkedRoleId)
  //     }
  //
  //     const revelantLevelRole = guild.levelRoles.find(
  //       (levelRole) => level >= levelRole.level
  //     )
  //
  //     await member.roles.remove(
  //       guild.levelRoles
  //         .filter((levelRole) => levelRole !== revelantLevelRole)
  //         .map((levelRole) => levelRole.id as Snowflake)
  //     )
  //
  //     if (
  //       revelantLevelRole &&
  //       !member.roles.cache.has(revelantLevelRole.id as Snowflake)
  //     ) {
  //       await member.roles.add(revelantLevelRole.id)
  //     }
  //   }
  //
  //   await prisma.user.update({
  //     where: {
  //       discordId: member.id,
  //     },
  //     data: {
  //       lastSyncedDiscordAt: new Date(),
  //     },
  //   })
  // }
}
