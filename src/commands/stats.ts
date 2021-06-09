import { Command } from './index'
import prisma from '../prisma'
import {
  getMinecraftProfileByName,
  minecraftNameRegex,
} from '../wrappers/minecraft'
import { getStatsMessage, Mode } from '../common/stats'

const stats: Command = {
  data: {
    name: 'stats',
    description: 'Display Bed Wars stats of player',
    options: [
      {
        name: 'name',
        description: 'Player name (linked user used if not provided)',
        type: 'STRING',
      },
    ],
  },
  handler: async (interaction) => {
    await interaction.defer()

    const name = interaction.options.get('name')?.value as string | undefined

    const interactionUser = !name
      ? await prisma.user.findUnique({
          where: {
            discordId: interaction.user.id,
          },
        })
      : null

    if (!name && !interactionUser) {
      await interaction.editReply(
        'You must either provide a name or link your account!'
      )
      return
    }

    if (name && !minecraftNameRegex.test(name)) {
      await interaction.editReply('This is not a valid name!')
      return
    }

    const minecraftProfile = name ? await getMinecraftProfileByName(name) : null

    if (name && !minecraftProfile) {
      await interaction.editReply('No player exists with given name!')
      return
    }

    await interaction.editReply(
      await getStatsMessage(
        name ? minecraftProfile!.id : interactionUser!.minecraftId!,
        Mode.OVERALL
      )
    )
  },
}

export default stats
