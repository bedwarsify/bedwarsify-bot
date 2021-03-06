import { Command } from './index'
import prisma from '../prisma'
import {
  getMinecraftProfileById,
  getMinecraftProfileByName,
  minecraftNameRegex,
} from '../wrappers/minecraft'
import hypixel from '../hypixel'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import syncGuildMember from '../sync'
import { GuildMember } from 'discord.js'

const link: Command = {
  data: {
    name: 'link',
    description: 'Link your Minecraft and Discord accounts',
    options: [
      {
        name: 'add',
        description: 'Links your Minecraft and Discord accounts',
        type: 'SUB_COMMAND',
        options: [
          {
            name: 'name',
            description: 'Your Minecraft name',
            type: 'STRING',
            required: true,
          },
        ],
      },
      {
        name: 'remove',
        description: 'Unlinks your Minecraft and Discord accounts',
        type: 'SUB_COMMAND',
      },
    ],
  },
  handler: async (interaction) => {
    if (interaction.options.has('add')) {
      const name = interaction.options.get('add')?.options?.get('name')
        ?.value as string

      if (!minecraftNameRegex.test(name)) {
        await interaction.reply({
          content: 'This is not a valid Minecraft name!',
          ephemeral: true,
        })
      } else {
        const minecraftProfile = await getMinecraftProfileByName(name)

        if (minecraftProfile === null) {
          await interaction.reply({
            content: 'There is no Minecraft account with given name!',
            ephemeral: true,
          })
        } else {
          const hypixelPlayer = await hypixel.player.uuid(minecraftProfile.id)

          if (
            hypixelPlayer.socialMedia?.links.DISCORD !== interaction.user.tag
          ) {
            await interaction.reply({
              content:
                "This Hypixel player's Discord is not set to your Discord account!\n\n" +
                'To continue:\n' +
                '1. Join `hypixel.net`.\n' +
                '2. Type `/profile`.\n' +
                '3. Click `Social Media`.\n' +
                '4. Click `Discord`.\n' +
                `5. Type \`/ac ${interaction.user.tag}\`.`,
              ephemeral: true,
            })
          } else {
            await prisma.user
              .update({
                where: {
                  discordId: interaction.user.id,
                },
                data: {
                  discordId: null,
                },
              })
              .catch(async (error) => {
                if (
                  !(
                    error instanceof PrismaClientKnownRequestError &&
                    error.code === 'P2025'
                  )
                ) {
                  throw error
                }
              })

            await prisma.user.upsert({
              where: {
                minecraftId: minecraftProfile.id,
              },
              update: {
                discordId: interaction.user.id,
              },
              create: {
                minecraftId: minecraftProfile.id,
                discordId: interaction.user.id,
              },
            })

            if (interaction.guild !== null) {
              await syncGuildMember(interaction.member as GuildMember)
            }

            await interaction.reply({
              content: `Your Discord account has been linked to Minecraft account ${minecraftProfile.name}.`,
              ephemeral: true,
            })
          }
        }
      }
    } else if (interaction.options.has('remove')) {
      const user = await prisma.user.findUnique({
        where: {
          discordId: interaction.user.id,
        },
        select: {
          id: true,
          minecraftId: true,
          discordId: true,
        },
      })

      if (user === null) {
        await interaction.reply({
          content:
            'Your Discord account is not linked to any Minecraft account!',
          ephemeral: true,
        })
      } else {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            discordId: null,
          },
        })

        if (interaction.guild !== null) {
          await syncGuildMember(interaction.member as GuildMember)
        }

        await interaction.reply({
          content: `Your Discord account has been unlinked from Minecraft account ${
            (
              await getMinecraftProfileById(user.minecraftId!)
            ).name
          }.`,
          ephemeral: true,
        })
      }
    }
  },
}

export default link
