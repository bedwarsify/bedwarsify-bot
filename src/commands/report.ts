import { Command } from './index'
import {
  getMinecraftProfileByName,
  minecraftNameRegex,
} from '../wrappers/minecraft'
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
    const name = interaction.options.get('name')?.value as string
    const reason = interaction.options.get('reason')?.value as
      | 'HACKER'
      | 'SNIPER'

    if (!minecraftNameRegex.test(name)) {
      await interaction.reply({
        content: 'This is not a valid Minecraft name!',
        ephemeral: true,
      })
    } else {
      const reporterUser = await prisma.user.findUnique({
        where: {
          discordId: interaction.user.id,
        },
      })

      if (reporterUser === null) {
        await interaction.reply({
          content: 'You must link your account to be able to report users!',
          ephemeral: true,
        })
        return
      }

      if (!reporterUser.canReport) {
        await interaction.reply({
          content: 'You cannot report!',
          ephemeral: true,
        })
        return
      }

      const reporteeMinecraft = await getMinecraftProfileByName(name)

      if (reporteeMinecraft === null) {
        await interaction.reply({
          content: 'No player exists with given name!',
          ephemeral: true,
        })
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
        await interaction.reply({
          content: 'You cannot report this user!',
          ephemeral: true,
        })
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
        await interaction.reply({
          content: 'You have already reported this user!',
          ephemeral: true,
        })
        return
      }

      const reporterHypixel = await hypixel.player.uuid(
        reporterUser.minecraftId!
      )

      if (reporterHypixel.stats.Bedwars === undefined) {
        await interaction.reply({
          content: 'You must be at least Bed Wars level 50 to report players!',
          ephemeral: true,
        })
        return
      }

      const reporterLevel = getBedwarsLevelInfo(reporterHypixel)

      if (reporterLevel.level < 50) {
        await interaction.reply({
          content: 'You must be at least Bed Wars level 50 to report players!',
          ephemeral: true,
        })
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
        await interaction.reply({
          content: 'You cannot submit any more reports at the moment!',
          ephemeral: true,
        })
        return
      }

      const reporteeHypixel = await hypixel.player.uuid(reporteeMinecraft.id)
      const reporteeRank = getPlayerRank(reporteeHypixel)

      if (reporteeRank.staff || reporteeRank.cleanName === 'YOUTUBER') {
        await interaction.reply({
          content: 'You cannot report staff or YouTubers!',
          ephemeral: true,
        })
        return
      }

      const reporteeLevel =
        reporteeHypixel.stats.Bedwars !== undefined
          ? getBedwarsLevelInfo(reporteeHypixel)
          : null

      if ((reporteeLevel?.level ?? 0) > reporterLevel.level / 2) {
        await interaction.reply({
          content:
            'You can only report players who are not more than half your level!',
          ephemeral: true,
        })
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

      await interaction.reply({
        content: `Reported ${reporteeHypixel.displayname} for ${
          reason === 'SNIPER' ? 'sniping' : 'hacking'
        }.`,
        ephemeral: true,
      })
    }
  },
}

export default report
