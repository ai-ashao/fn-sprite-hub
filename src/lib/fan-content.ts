import disclaimerText from '@/data/epic-fan-content-disclaimer.txt?raw'

const placeholderPrefix = 'PASTE THE EXACT CURRENT DISCLAIMER'

export const epicFanContentDisclaimer = disclaimerText.trim()

export const hasConfiguredEpicFanContentDisclaimer =
  epicFanContentDisclaimer.length >= 100 && !epicFanContentDisclaimer.startsWith(placeholderPrefix)
