import { getStatsMessage, StatsMessageComponentCustomID } from '../common/stats'
import { MessageComponentInteraction } from 'discord.js'

type MessageComponentCustomID = StatsMessageComponentCustomID

export async function handleMessageComponentInteraction(
  interaction: MessageComponentInteraction
): Promise<void> {
  const customID = interaction.customID.split(',') as MessageComponentCustomID

  if (customID[0] === 'STATS') {
    await interaction.update(await getStatsMessage(customID[1], customID[2]))
  }
}
