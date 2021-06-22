import { Command } from './index'
import { GuildMember, Permissions, Snowflake } from 'discord.js'
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
      await interaction.reply({
        content: 'This command can only be used in servers!',
        ephemeral: true,
      })
    } else if (
      !(interaction.member as GuildMember).permissions.has(
        Permissions.FLAGS.MANAGE_GUILD
      )
    ) {
      await interaction.reply({
        content:
          'This command is only available to users with the Manage Guild permission!',
        ephemeral: true,
      })
    } else {
      if (interaction.options.has('roles')) {
        if (interaction.options.get('roles')?.options?.has('linked')) {
          const roleId = interaction.options
            .get('roles')
            ?.options?.get('linked')
            ?.options?.get('role') as string | undefined

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

            await interaction.reply({
              content: 'Disabled the linked role.',
              ephemeral: true,
            })
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

            await interaction.reply({
              content: `Set the linked role to ${await interaction.guild.roles.fetch(
                roleId as Snowflake
              )}.`,
              ephemeral: true,
            })
          }
        }
      }
    }
  },
}

export default settings
