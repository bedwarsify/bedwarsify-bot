import { GuildMember } from 'discord.js'
import prisma from './prisma'
import hypixel from './hypixel'
import { getBedwarsLevelInfo } from '@zikeji/hypixel'

export default async function syncGuildMember(member: GuildMember) {
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
      await member.roles.remove(discordGuild!!.linkedRoleId)
    }

    await member.setNickname(null).catch(() => {})
  } else {
    if (discordGuild?.linkedRoleId !== null) {
      await member.roles.add(discordGuild!!.linkedRoleId)
    }

    const hypixelPlayer = await hypixel.player.uuid(user.minecraftId!!)

    if (hypixelPlayer.stats.Bedwars !== undefined) {
      const bedWarsLevelInfo = getBedwarsLevelInfo(hypixelPlayer)

      await member
        .setNickname(
          `[${bedWarsLevelInfo.level}✫] ${hypixelPlayer.displayname}`
        )
        .catch(() => {})
    } else {
      await member
        .setNickname(`[0✫] ${hypixelPlayer.displayname}`)
        .catch(() => {})
    }
  }
}
