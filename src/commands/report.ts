import { Command } from './index'
import { getMinecraftProfile, minecraftNameRegex } from '../wrappers/minecraft'
import prisma from '../prisma'
import hypixel from '../hypixel'
import { UserRole } from '@prisma/client'
import { getBedwarsLevelInfo, getPlayerRank } from '@zikeji/hypixel'
import axios from 'axios'

const report: Command = {
  data: {
    name: 'report',
    description: 'Report a player for hacking or sniping',
    options: [
      {
        name: 'name',
        description: 'Name of the player you would like to report',
        type: 'STRING',
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for the report',
        type: 'STRING',
        required: true,
        choices: [
          {
            name: 'Hacker',
            value: 'HACKER',
          },
          {
            name: 'Sniper',
            value: 'SNIPER',
          },
        ],
      },
    ],
  },
  handler: async (interaction) => {
    await interaction.defer(true)

    const name = interaction.options[0].value as string
    const reason = interaction.options[1].value as 'HACKER' | 'SNIPER'

    if (!minecraftNameRegex.test(name)) {
      await interaction.editReply('This is not a valid Minecraft name!')
    } else {
      const reporterUser = await prisma.user.findUnique({
        where: {
          discordId: interaction.user.id,
        },
      })

      if (reporterUser === null) {
        await interaction.editReply(
          'You must link your account to be able to report users!'
        )
        return
      }

      if (!reporterUser.canReport) {
        await interaction.editReply('You cannot report!')
        return
      }

      const reporteeMinecraft = await getMinecraftProfile(name)

      if (reporteeMinecraft === null) {
        await interaction.editReply('No player exists with given name!')
        return
      }

      const reporteeUser = await prisma.user.findUnique({
        where: {
          minecraftId: reporteeMinecraft.id,
        },
      })

      if (
        reporteeUser !== null &&
        (reporteeUser.role === UserRole.DEVELOPER ||
          reporteeUser.role === UserRole.COMMUNITY_MANAGER)
      ) {
        await interaction.editReply('You cannot report this user!')
        return
      }

      if (
        reporteeUser !== null &&
        (await prisma.report.count({
          where: {
            reporter: {
              id: reporterUser.id,
            },
            reportee: {
              id: reporteeUser.id,
            },
          },
        })) > 0
      ) {
        await interaction.editReply('You have already reported this user!')
        return
      }

      const reporterHypixel = await hypixel.player.uuid(
        reporterUser.minecraftId!
      )

      if (reporterHypixel.stats.Bedwars === undefined) {
        await interaction.editReply(
          'You must be at least Bed Wars level 50 to report players!'
        )
        return
      }

      const reporterLevel = getBedwarsLevelInfo(reporterHypixel)

      if (reporterLevel.level < 50) {
        await interaction.editReply(
          'You must be at least Bed Wars level 50 to report players!'
        )
        return
      }

      const reporterRecentReportsCount = await prisma.report.count({
        where: {
          reporterId: reporterUser.id,
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000),
          },
        },
      })

      if (reporterRecentReportsCount >= Math.ceil(reporterLevel.level / 100)) {
        await interaction.editReply(
          'You cannot submit any more reports at the moment!'
        )
        return
      }

      const reporteeHypixel = await hypixel.player.uuid(reporteeMinecraft.id)
      const reporteeRank = getPlayerRank(reporteeHypixel)

      if (reporteeRank.staff || reporteeRank.cleanName === 'YOUTUBER') {
        await interaction.editReply('You cannot report staff or YouTubers!')
        return
      }

      const reporteeLevel =
        reporteeHypixel.stats.Bedwars !== undefined
          ? getBedwarsLevelInfo(reporteeHypixel)
          : null

      if ((reporteeLevel?.level ?? 0) > reporterLevel.level / 2) {
        await interaction.editReply(
          'You can only report players who are not more than half your level!'
        )
        return
      }

      const weight =
        reporterUser.role === UserRole.DEVELOPER ||
        reporterUser.role === UserRole.COMMUNITY_MANAGER
          ? 1000
          : Math.floor(
              Math.min(
                reporterLevel.level /
                  ((reporteeLevel?.level ?? 0) === 0
                    ? 1
                    : reporteeLevel?.level ?? 1),
                reporterLevel.level / 10
              )
            )

      const report = await prisma.report.create({
        data: {
          reporter: {
            connect: {
              id: reporterUser.id,
            },
          },
          reportee: {
            connectOrCreate: {
              where: {
                minecraftId: reporteeMinecraft.id,
              },
              create: {
                minecraftId: reporteeMinecraft.id,
              },
            },
          },
          reason,
          weight,
        },
        select: {
          id: true,
          reason: true,
          weight: true,
          reporter: {
            select: {
              id: true,
              minecraftId: true,
              role: true,
            },
          },
          reportee: {
            select: {
              id: true,
              minecraftId: true,
              role: true,
            },
          },
        },
      })

      if (process.env.REPORTS_DISCORD_WEBHOOK_URL !== undefined) {
        const reporterRank = getPlayerRank(reporterHypixel)

        await axios.post(process.env.REPORTS_DISCORD_WEBHOOK_URL, {
          embeds: [
            {
              title: `[${reporteeLevel?.level ?? 0}|${(
                (reporteeHypixel.stats.Bedwars?.final_kills_bedwars ?? 0) /
                (reporteeHypixel.stats.Bedwars?.final_deaths_bedwars ?? 1)
              ).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}] ${
                reporteeRank.cleanPrefix !== ''
                  ? `${reporteeRank.cleanPrefix} `
                  : ''
              }${reporteeHypixel.displayname}`,
              timestamp: new Date().toISOString(),
              color: 0xef4444,
              thumbnail: {
                url: `https://crafatar.com/avatars/${reporteeHypixel.uuid}?size=128&default=MHF_Steve`,
              },
              author: {
                name: `[${reporterLevel?.level ?? 0}|${(
                  (reporterHypixel.stats.Bedwars?.final_kills_bedwars ?? 0) /
                  (reporterHypixel.stats.Bedwars?.final_deaths_bedwars ?? 1)
                ).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}] ${
                  reporterRank.cleanPrefix !== ''
                    ? `${reporterRank.cleanPrefix} `
                    : ''
                }${reporterHypixel.displayname}`,
                icon_url: `https://crafatar.com/avatars/${reporterHypixel.uuid}?size=32&default=MHF_Steve`,
              },
              fields: [
                {
                  name: 'Reason',
                  value: reason === 'SNIPER' ? 'Sniper' : 'Hacker',
                  inline: true,
                },
                {
                  name: 'Weight',
                  value: weight,
                  inline: true,
                },
                {
                  name: 'ID',
                  value: report.id,
                },
              ],
            },
          ],
        })
      }

      await interaction.editReply(
        `Reported ${reporteeHypixel.displayname} for ${
          reason === 'SNIPER' ? 'sniping' : 'hacking'
        }.`
      )
    }
  },
}

export default report
