import axios from 'axios'

export const minecraftNameRegex = /^[A-Za-z0-9_]{3,16}$/

interface Profile {
  id: string
  name: string
}

export async function getMinecraftProfileByName(
  name: string
): Promise<Profile | null> {
  const response = await axios.get(
    `https://api.mojang.com/users/profiles/minecraft/${name}`
  )

  if (response.status === 204) {
    return null
  }

  return response.data as Profile
}

export async function getMinecraftProfileById(id: string): Promise<Profile> {
  const response = await axios.get(
    `https://sessionserver.mojang.com/session/minecraft/profile/${id}`
  )

  return response.data as Profile
}

interface ProfileNameHistoryItem {
  name: string
  changedToAt?: number
}

type ProfileNameHistory = ProfileNameHistoryItem[]

export async function getMinecraftProfileNameHistory(
  id: string
): Promise<ProfileNameHistory | null> {
  const response = await axios.get(
    `https://api.mojang.com/user/profiles/${id}/names`
  )

  if (response.status === 204) {
    return null
  }

  return response.data as ProfileNameHistory
}
