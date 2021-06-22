import { Command } from './index'
import { GuildMember, Permissions, Snowflake } from 'discord.js'
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
      await interaction.reply({
        content: 'This command can only be used in servers!',
        ephemeral: true,
      })
    } else {
      const userId =
        (interaction.options.get('user')?.value as string | undefined) ??
        interaction.user.id

      if (
        userId !== interaction.user.id &&
        !(interaction.member as GuildMember).permissions.has(
          Permissions.FLAGS.MANAGE_GUILD
        )
      ) {
        await interaction.reply({
          content:
            'You must have the Manage Guild permission to be able to sync other users!',
          ephemeral: true,
        })
      } else {
        const member = await interaction.guild.members.fetch(
          userId as Snowflake
        )

        if (member.user.bot) {
          await interaction.reply({
            content: 'You cannot sync bots!',
            ephemeral: true,
          })
        } else {
          await syncGuildMember(member)

          await interaction.reply({
            content: `Synced ${member}.`,
            ephemeral: true,
          })
        }
      }
    }
  },
}

export default sync
