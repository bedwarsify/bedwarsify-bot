import { MessageEmbed, WebhookEditMessageOptions } from 'discord.js'
import hypixel from '../hypixel'
import { getPlayerRank } from '@zikeji/hypixel'
import { calculateBedWarsLevel } from '../utils/hypixel'

export enum Mode {
  OVERALL = 'OVERALL',
  EIGHT_ONE = 'EIGHT_ONE',
  EIGHT_TWO = 'EIGHT_TWO',
  FOUR_THREE = 'FOUR_THREE',
  FOUR_FOUR = 'FOUR_FOUR',
  TWO_FOUR = 'TWO_FOUR',
}

const modeFriendlyNames = {
  [Mode.OVERALL]: 'Overall',
  [Mode.EIGHT_ONE]: 'Solo',
  [Mode.EIGHT_TWO]: 'Doubles',
  [Mode.FOUR_THREE]: '3v3v3v3',
  [Mode.FOUR_FOUR]: '4v4v4v4',
  [Mode.TWO_FOUR]: '4v4',
}

export type StatsMessageComponentCustomID = ['STATS', string, Mode]

export async function getStatsMessage(
  id: string,
  mode: Mode
): Promise<WebhookEditMessageOptions> {
  const hypixelPlayer = await hypixel.player.uuid(id)
  const hypixelPlayerRank = await getPlayerRank(hypixelPlayer)
  const level = calculateBedWarsLevel(
    hypixelPlayer.stats.Bedwars?.Experience ||
      hypixelPlayer.stats.Bedwars?.Experience_new ||
      0
  )
  const modePrefix = mode === Mode.OVERALL ? '' : mode.toLowerCase() + '_'

  return {
    embeds: [
      new MessageEmbed({
        title:
          ((hypixelPlayer.prefix as string | undefined)
            ? (hypixelPlayer.prefix as string).replace(/§./g, '') + ' '
            : hypixelPlayerRank.cleanPrefix
            ? hypixelPlayerRank.cleanPrefix + ' '
            : '') + hypixelPlayer.displayname.replace('_', '\\_'),
        color: Number.parseInt(hypixelPlayerRank.colorHex, 16),
        author: {
          name: `Bed Wars Stats — ${modeFriendlyNames[mode]}`,
          iconURL: 'https://bedwarsify.s3.amazonaws.com/icon.png',
        },
        thumbnail: {
          url: `https://crafatar.com/avatars/${id}?size=64`,
        },
        fields: [
          {
            name: 'Level',
            value: level.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            }),
            inline: true,
          },
          {
            name: 'Index',
            value: (
              level *
              (((hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'final_kills_bedwars'
              ] as number | undefined) || 0) /
                ((hypixelPlayer.stats.Bedwars?.[
                  modePrefix + 'final_deaths_bedwars'
                ] as number | undefined) || 0)) **
                2
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'WS',
            value: (
              hypixelPlayer.stats.Bedwars?.[modePrefix + 'winstreak'] || 0
            )?.toString(),
            inline: true,
          },
          {
            name: 'FKDR',
            value: (
              ((hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'final_kills_bedwars'
              ] as number | undefined) || 0) /
              ((hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'final_deaths_bedwars'
              ] as number | undefined) || 0)
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Final Kills',
            value: (
              (hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'final_kills_bedwars'
              ] as number | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Final Deaths',
            value: (
              (hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'final_deaths_bedwars'
              ] as number | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'WLR',
            value: (
              ((hypixelPlayer.stats.Bedwars?.[modePrefix + 'wins_bedwars'] as
                | number
                | undefined) || 0) /
              ((hypixelPlayer.stats.Bedwars?.[modePrefix + 'losses_bedwars'] as
                | number
                | undefined) || 0)
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Wins',
            value: (
              (hypixelPlayer.stats.Bedwars?.[modePrefix + 'wins_bedwars'] as
                | number
                | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Losses',
            value: (
              (hypixelPlayer.stats.Bedwars?.[modePrefix + 'losses_bedwars'] as
                | number
                | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'BBLR',
            value: (
              ((hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'beds_broken_bedwars'
              ] as number | undefined) || 0) /
              ((hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'beds_lost_bedwars'
              ] as number | undefined) || 0)
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Beds Broken',
            value: (
              (hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'beds_broken_bedwars'
              ] as number | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Beds Lost',
            value: (
              (hypixelPlayer.stats.Bedwars?.[
                modePrefix + 'beds_lost_bedwars'
              ] as number | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'KDR',
            value: (
              ((hypixelPlayer.stats.Bedwars?.[modePrefix + 'kills_bedwars'] as
                | number
                | undefined) || 0) /
              ((hypixelPlayer.stats.Bedwars?.[modePrefix + 'deaths_bedwars'] as
                | number
                | undefined) || 0)
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Kills',
            value: (
              (hypixelPlayer.stats.Bedwars?.[modePrefix + 'kills_bedwars'] as
                | number
                | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
          {
            name: 'Deaths',
            value: (
              (hypixelPlayer.stats.Bedwars?.[modePrefix + 'deaths_bedwars'] as
                | number
                | undefined) || 0
            ).toLocaleString(undefined, { maximumFractionDigits: 2 }),
            inline: true,
          },
        ],
      }),
    ],
    components: [
      {
        components: [
          {
            label: modeFriendlyNames[Mode.OVERALL],
            customID: (
              ['STATS', id, Mode.OVERALL] as StatsMessageComponentCustomID
            ).join(','),
            style: mode === Mode.OVERALL ? 'PRIMARY' : 'SECONDARY',
            type: 'BUTTON',
          },
          {
            label: modeFriendlyNames[Mode.EIGHT_ONE],
            customID: (
              ['STATS', id, Mode.EIGHT_ONE] as StatsMessageComponentCustomID
            ).join(','),
            style: mode === Mode.EIGHT_ONE ? 'PRIMARY' : 'SECONDARY',
            type: 'BUTTON',
          },
          {
            label: modeFriendlyNames[Mode.EIGHT_TWO],
            customID: (
              ['STATS', id, Mode.EIGHT_TWO] as StatsMessageComponentCustomID
            ).join(','),
            style: mode === Mode.EIGHT_TWO ? 'PRIMARY' : 'SECONDARY',
            type: 'BUTTON',
          },
        ],
        type: 'ACTION_ROW',
      },
      {
        components: [
          {
            label: modeFriendlyNames[Mode.FOUR_THREE],
            customID: (
              ['STATS', id, Mode.FOUR_THREE] as StatsMessageComponentCustomID
            ).join(','),
            style: mode === Mode.FOUR_THREE ? 'PRIMARY' : 'SECONDARY',
            type: 'BUTTON',
          },
          {
            label: modeFriendlyNames[Mode.FOUR_FOUR],
            customID: (
              ['STATS', id, Mode.FOUR_FOUR] as StatsMessageComponentCustomID
            ).join(','),
            style: mode === Mode.FOUR_FOUR ? 'PRIMARY' : 'SECONDARY',
            type: 'BUTTON',
          },
          {
            label: modeFriendlyNames[Mode.TWO_FOUR],
            customID: (
              ['STATS', id, Mode.TWO_FOUR] as StatsMessageComponentCustomID
            ).join(','),
            style: mode === Mode.TWO_FOUR ? 'PRIMARY' : 'SECONDARY',
            type: 'BUTTON',
          },
        ],
        type: 'ACTION_ROW',
      },
      {
        components: [
          {
            label: 'Plancke.io',
            url: `https://plancke.io/hypixel/player/stats/${id}`,
            style: 'LINK',
            type: 'BUTTON',
          },
        ],
        type: 'ACTION_ROW',
      },
    ],
  }
}
