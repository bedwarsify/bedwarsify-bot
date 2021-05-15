import { Command } from './index'
import { GuildMember, Permissions } from 'discord.js'
import syncGuildMember from '../sync'

const sync: Command = {
  data: {
    name: 'sync',
    description: 'Syncs user',
    options: [
      {
        name: 'user',
        description: 'User to sync (empty to sync yourself)',
        type: 'USER',
      },
    ],
  },
  handler: async (interaction) => {
    if (interaction.guild === null) {
      await interaction.reply('This command can only be used in servers!', {
        ephemeral: true,
      })
    } else {
      const userId =
        (interaction.options[0]?.value as string | undefined) ??
        interaction.user.id

      if (
        userId !== interaction.user.id &&
        !(interaction.member as GuildMember).permissions.has(
          Permissions.FLAGS.MANAGE_GUILD
        )
      ) {
        await interaction.reply(
          'You must have the Manage Guild permission to be able to sync other users!',
          {
            ephemeral: true,
          }
        )
      } else {
        await interaction.defer(true)

        const member = await interaction.guild.members.fetch(userId)

        if (member.user.bot) {
          await interaction.editReply('You cannot sync bots!')
        } else {
          await syncGuildMember(member)

          await interaction.editReply(`Synced ${member}.`)
        }
      }
    }
  },
}

export default sync
