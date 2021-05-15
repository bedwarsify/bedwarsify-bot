import { Command } from './index'
import { GuildMember, Permissions } from 'discord.js'
import prisma from '../prisma'

const settings: Command = {
  data: {
    name: 'settings',
    description: 'Modify settings',
    options: [
      {
        name: 'roles',
        description: 'Set up automatic Discord roles',
        type: 'SUB_COMMAND_GROUP',
        options: [
          {
            name: 'linked',
            description:
              'Sets the Discord role given for linking Minecraft account',
            type: 'SUB_COMMAND',
            options: [
              {
                name: 'role',
                description:
                  'Role that should be given for linking account (empty to disable)',
                type: 'ROLE',
              },
            ],
          },
        ],
      },
    ],
  },
  handler: async (interaction) => {
    if (interaction.guild === null) {
      await interaction.reply('This command can only be used in servers!', {
        ephemeral: true,
      })
    } else if (
      !(interaction.member as GuildMember).permissions.has(
        Permissions.FLAGS.MANAGE_GUILD
      )
    ) {
      await interaction.reply(
        'This command is only available to users with the Manage Guild permission!'
      )
    } else {
      if (interaction.options[0].name === 'roles') {
        if (interaction.options[0].options?.[0].name === 'linked') {
          await interaction.defer(true)

          const roleId = interaction.options[0].options[0].options?.[0]
            .value as string | undefined

          if (roleId === undefined) {
            await prisma.discordGuild.upsert({
              where: {
                id: interaction.guild.id,
              },
              update: {
                linkedRoleId: null,
              },
              create: {
                id: interaction.guild.id,
                linkedRoleId: null,
              },
            })

            await interaction.editReply('Disabled the linked role.')
          } else {
            await prisma.discordGuild.upsert({
              where: {
                id: interaction.guild.id,
              },
              update: {
                linkedRoleId: roleId,
              },
              create: {
                id: interaction.guild.id,
                linkedRoleId: roleId,
              },
            })

            await interaction.editReply(
              `Set the linked role to ${await interaction.guild.roles.fetch(
                roleId
              )}.`
            )
          }
        }
      }
    }
  },
}

export default settings
