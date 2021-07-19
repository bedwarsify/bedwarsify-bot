import { GuildMember, Snowflake } from 'discord.js'
import prisma from './prisma'
import hypixel from './hypixel'
import { getBedwarsLevelInfo } from '@zikeji/hypixel'
import { calculateBedWarsLevel } from './utils/hypixel'

export default async function syncGuildMember(
  member: GuildMember
): Promise<void> {
  if (member.user.bot) return

  const user = await prisma.user.findUnique({
    where: {
      discordId: member.id,
    },
  })
  const discordGuild = await prisma.discordGuild.findUnique({
    where: {
      id: member.guild.id,
    },
  })

  if (user === null) {
    if (discordGuild?.linkedRoleId !== null) {
      await member.roles.remove(discordGuild!.linkedRoleId)
    }

    await member.setNickname(null).catch(() => undefined)
  } else {
    if (discordGuild?.linkedRoleId !== null) {
      await member.roles.add(discordGuild!.linkedRoleId)
    }

    const hypixelPlayer = await hypixel.player.uuid(user.minecraftId!)

    if (hypixelPlayer.stats.Bedwars !== undefined) {
      const bedWarsLevelInfo = getBedwarsLevelInfo(hypixelPlayer)

      await member
        .setNickname(
          `[${bedWarsLevelInfo.level}✫|${(
            (hypixelPlayer.stats.Bedwars.final_kills_bedwars || 0) /
            (hypixelPlayer.stats.Bedwars.final_deaths_bedwars !== 0
              ? hypixelPlayer.stats.Bedwars.final_deaths_bedwars || 1
              : 1)
          ).toLocaleString(undefined, { maximumFractionDigits: 1 })}] ${
            hypixelPlayer.displayname
          }`
        )
        .catch(() => undefined)
    } else {
      await member
        .setNickname(`[0✫|0] ${hypixelPlayer.displayname}`)
        .catch(() => undefined)
    }

    const discordLevelRoles = await prisma.discordLevelRole.findMany({
      where: {
        guildId: member.guild.id,
      },
      orderBy: {
        level: 'desc',
      },
      select: {
        id: true,
        level: true,
      },
    })

    const level = calculateBedWarsLevel(
      hypixelPlayer.stats.Bedwars?.Experience_new ||
        hypixelPlayer.stats.Bedwars?.Experience ||
        0
    )
    let relevantLevelRoleId: string | null = null

    for (const levelRole of discordLevelRoles) {
      if (level >= levelRole.level) {
        relevantLevelRoleId = levelRole.id
        break
      }
    }

    await member.roles
      .remove(
        discordLevelRoles
          .filter(
            (levelRole) =>
              levelRole.id !== relevantLevelRoleId ||
              !member.roles.cache.has(levelRole.id as Snowflake)
          )
          .map((levelRole) => levelRole.id as Snowflake)
      )
      .catch(() => {})

    if (
      relevantLevelRoleId &&
      !member.roles.cache.has(relevantLevelRoleId as Snowflake)
    ) {
      await member.roles.add(relevantLevelRoleId as Snowflake).catch(() => {})
    }
  }
}
