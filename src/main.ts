import { Client, Intents, Team } from 'discord.js'
import dotenv from 'dotenv'
import commands from './commands'
import syncGuildMember from './sync'

dotenv.config()

const client = new Client({
  intents: [Intents.NON_PRIVILEGED, Intents.FLAGS.GUILD_MEMBERS],
})

client.once('ready', async () => {
  if (
    process.env.COMMANDS_GUILD_ID !== undefined &&
    process.env.COMMANDS_GUILD_ID !== ''
  ) {
    await (
      await client.guilds.fetch(process.env.COMMANDS_GUILD_ID)
    ).commands.set(commands.map((command) => command.data))
  } else {
    await client.application?.commands.set(
      commands.map((command) => command.data)
    )
  }

  console.log('Ready')
})

const interactionCooldown = 5 * 1000
const lastInteractionAt: { [key: string]: number } = {}

client.on('interaction', async (interaction) => {
  if (interaction.isCommand()) {
    if (
      interaction.client.application?.owner === interaction.user ||
      (interaction.client.application?.owner instanceof Team &&
        interaction.client.application.owner.members.has(
          interaction.user.id
        )) ||
      lastInteractionAt[interaction.user.id] === undefined ||
      Date.now() - lastInteractionAt[interaction.user.id] > interactionCooldown
    ) {
      await commands
        .find((command) => command.data.name === interaction.commandName)
        ?.handler(interaction)
    } else {
      await interaction.reply(
        `Please wait ${(
          interactionCooldown -
          (Date.now() - lastInteractionAt[interaction.user.id])
        ).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} before using a command!`,
        {
          ephemeral: true,
        }
      )
    }
  }
})

client.on('guildMemberAdd', async (member) => {
  if (!member.user.bot) {
    await syncGuildMember(member)
  }
})

const lastAutoSyncAt: { [key: string]: number } = {}

client.on('message', async (message) => {
  if (
    message.guild !== null &&
    message.member !== null &&
    !message.author.bot
  ) {
    const key = `${message.guild.id}-${message.member.id}`

    if (
      lastAutoSyncAt[key] === undefined ||
      Date.now() - lastAutoSyncAt[key] > 15 * 60 * 1000
    ) {
      lastAutoSyncAt[key] = Date.now()
      await syncGuildMember(message.member)
    }
  }
})

client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log('Logged in')
})
