/** Editorial claims, not a second Sprite/artwork/entry catalog. */
export const guidanceCheckedAt = '2026-09-11'
export const guidanceSources = {
  override42: {
    title: 'Epic Games: v42.00 Override update notes',
    url: 'https://communities.epicgames.com/thread/v42-00-fortnite-override-battle-royale-update-notes/L5R3/',
    section: 'A Whole New Generation of Sprites; Cheat Codes',
    patch: 'v42.00',
  },
  override421: {
    title: 'Epic Games: v42.10 Override update notes',
    url: 'https://communities.epicgames.com/thread/v42-10-fortnite-override-battle-royale-update-notes/y3Ub/',
    section: 'New Sprites & Quality-Of-Life Improvements; Bug Fixes',
    patch: 'v42.10',
  },
} as const
export const collectionMasteryRule =
  'Extracting a duplicate adds Sprite XP to the copy in your collection. Once that copy is at maximum level, take it into a match and extract it to master it.'
export const generalAcquisitionRule =
  'Island Cheat Codes can release a Sprite when interacted with and entered. This is a general seasonal source, not a guaranteed route to a particular family or finish.'
export type SpriteGuidance = {
  ability: string
  leveling: string
  levelingSource: keyof typeof guidanceSources
  unlock?: string
  unlockSource?: keyof typeof guidanceSources
  task: string
  acquisitionStatus: 'partially-supported' | 'needs-evidence'
}
export const spriteGuidance: Readonly<Partial<Record<string, SpriteGuidance>>> = {
  crown: {
    ability: 'Awards bonus Crown Wins after a Victory Royale.',
    leveling:
      'Crown’s in-match leveling condition is winning matches, rather than ordinary XP actions.',
    levelingSource: 'override42',
    unlock:
      'Mastering Crown unlocks its Cheat Master variant; v42.10 fixes the earlier failure to award it.',
    unlockSource: 'override421',
    task: 'Check Crown’s in-game progress before a match. After a successful extraction, check the awarded finish before updating that separate entry here.',
    acquisitionStatus: 'partially-supported',
  },
  klombo: {
    ability: 'Provides random items as it gains levels.',
    leveling: 'Klombo’s in-match levels come from using consumables that restore Health or Shield.',
    levelingSource: 'override42',
    task: 'Check the in-game level indicator as you use your consumables. Keep finding, leveling and extracting the Sprite separate from marking your local collection.',
    acquisitionStatus: 'needs-evidence',
  },
}
