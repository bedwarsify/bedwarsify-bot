import { Client, Intents, Snowflake, Team } from 'discord.js'
import dotenv from 'dotenv'
import commands from './commands'
import syncGuildMember from './sync'
import { handleMessageComponentInteraction } from './components'
import axios from 'axios'
import prisma from './prisma'

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
      await client.guilds.fetch(process.env.COMMANDS_GUILD_ID as Snowflake)
    ).commands.set(commands.map((command) => command.data))
  } else {
    await client.application?.commands.set(
      commands.map((command) => command.data)
    )
  }

  console.log('Ready')

  if (process.env.DISCORD_AUTO_SYNC_GUILD_ID) {
    setInterval(async () => {
      const users = await prisma.user.findMany({
        where: {
          minecraftId: {
            not: null,
          },
          discordId: {
            not: null,
          },
        },
        select: {
          discordId: true,
        },
        orderBy: {
          lastSyncedDiscordAt: 'asc',
        },
        take: Number(process.env.DISCORD_AUTO_SYNC_MEMBER_COUNT || 0),
      })

      const guild = await client.guilds
        .fetch(process.env.DISCORD_AUTO_SYNC_GUILD_ID as Snowflake)
        .catch(() => null)

      if (!guild) return

      await Promise.all(
        users.map(async (user) => {
          const member = await guild.members
            .fetch(user.discordId as Snowflake)
            .catch(() => null)

          if (!member) return

          await syncGuildMember(member)
        })
      )
    }, 60e3)
  }

  if (process.env.HEARTBEAT_URL) {
    axios.get(process.env.HEARTBEAT_URL)

    setInterval(async () => {
      await axios.get(process.env.HEARTBEAT_URL!)
    }, Number(process.env.HEARTBEAT_INTERVAL || 60e3))
  }
})

const interactionCooldown = 5 * 1000
const lastInteractionAt: { [key: string]: number } = {}

client.on('interaction', async (interaction) => {
  if (
    interaction.client.application?.owner === interaction.user ||
    (interaction.client.application?.owner instanceof Team &&
      interaction.client.application.owner.members.has(interaction.user.id)) ||
    lastInteractionAt[interaction.user.id] === undefined ||
    Date.now() - lastInteractionAt[interaction.user.id] > interactionCooldown
  ) {
    if (interaction.isCommand()) {
      await commands
        .find((command) => command.data.name === interaction.commandName)
        ?.handler(interaction)
    } else if (interaction.isMessageComponent()) {
      await handleMessageComponentInteraction(interaction)
    }
  } else {
    if (interaction.isCommand() || interaction.isMessageComponent()) {
      await interaction.reply(
        `Please wait ${(
          interactionCooldown -
          (Date.now() - lastInteractionAt[interaction.user.id])
        ).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })} before another interaction!`,
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
