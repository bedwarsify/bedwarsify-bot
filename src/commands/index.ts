import { ApplicationCommandData, CommandInteraction } from 'discord.js'
import link from './link'
import settings from './settings'
import sync from './sync'

export interface Command {
  data: ApplicationCommandData
  handler: (interaction: CommandInteraction) => Promise<void>
}

const commands: Command[] = [link, sync, settings]

export default commands
