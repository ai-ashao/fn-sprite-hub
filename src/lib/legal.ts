export const legalTemplateVersion = '0.2' as const

export type LegalProvider = {
  name: string
  purpose: string
}

export type LegalProcessingActivity = {
  data: string
  purpose: string
  legalBasis: string
  retention: string
  recipients: ReadonlyArray<string>
}

export type LegalAnalyticsProfile = LegalProvider & {
  data: string
  legalBasis: string
  retention: string
}

export type LegalFeatureProfile = {
  analytics: false | LegalAnalyticsProfile
}

export type LegalProfile = {
  templateVersion: typeof legalTemplateVersion
  templateKind: 'free-local-tool'
  productName: string
  operatorName: string
  siteUrl: string
  contactEmail: string
  effectiveDate: string
  lastUpdated: string
  features: LegalFeatureProfile
  privacy: {
    processingActivities: ReadonlyArray<LegalProcessingActivity>
    browserStorage: ReadonlyArray<string>
    serviceProviders: ReadonlyArray<LegalProvider>
    internationalTransfers: string
  }
}

export type LegalSection = {
  id: string
  title: string
  paragraphs: ReadonlyArray<string>
  items?: ReadonlyArray<string>
}

export type LegalDocument = {
  kind: 'privacy' | 'terms'
  title: string
  description: string
  sections: ReadonlyArray<LegalSection>
}

export function defineLegalProfile<const T extends LegalProfile>(profile: T): T {
  return profile
}

export function defaultSupportEmailForSite(
  siteUrl: string,
  options: Readonly<{ fallbackSiteUrl?: string }> = {},
): string {
  try {
    return supportEmailForPublicSite(siteUrl)
  } catch (error) {
    if (!options.fallbackSiteUrl) throw error
    return supportEmailForPublicSite(options.fallbackSiteUrl)
  }
}

function supportEmailForPublicSite(siteUrl: string): string {
  const hostname = new URL(siteUrl).hostname.toLowerCase().replace(/^www\./, '')
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.includes(':') ||
    /^\d+(\.\d+)+$/.test(hostname)
  ) {
    throw new Error('A public domain is required to derive the default support email.')
  }
  return `support@${hostname}`
}

export function validateLegalProfile(profile: LegalProfile): ReadonlyArray<string> {
  const issues: string[] = []
  const requiredFields = {
    productName: profile.productName,
    operatorName: profile.operatorName,
    siteUrl: profile.siteUrl,
    contactEmail: profile.contactEmail,
    internationalTransfers: profile.privacy.internationalTransfers,
  }

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value.trim()) issues.push(`Legal profile ${field} is required.`)
    if (/\b(?:todo|tbd|replace me|your company|your product|example\.com)\b/i.test(value)) {
      issues.push(`Legal profile ${field} still contains placeholder copy.`)
    }
  }

  try {
    const url = new URL(profile.siteUrl)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol')
  } catch {
    issues.push('Legal profile siteUrl must be an absolute HTTP(S) URL.')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contactEmail)) {
    issues.push('Legal profile contactEmail must be a valid email address.')
  }

  for (const [field, value] of [
    ['effectiveDate', profile.effectiveDate],
    ['lastUpdated', profile.lastUpdated],
  ] as const) {
    if (!isIsoDate(value)) issues.push(`Legal profile ${field} must use a valid YYYY-MM-DD date.`)
  }
  if (
    isIsoDate(profile.effectiveDate) &&
    isIsoDate(profile.lastUpdated) &&
    profile.lastUpdated < profile.effectiveDate
  ) {
    issues.push('Legal profile lastUpdated must not be earlier than effectiveDate.')
  }

  validateList('browserStorage', profile.privacy.browserStorage, issues)

  if (profile.privacy.processingActivities.length === 0) {
    issues.push('Legal profile processingActivities must not be empty.')
  }
  for (const activity of profile.privacy.processingActivities) {
    if (
      !activity.data.trim() ||
      !activity.purpose.trim() ||
      !activity.legalBasis.trim() ||
      !activity.retention.trim()
    ) {
      issues.push('Every processing activity requires data, purpose, legalBasis, and retention.')
    }
    validateList(
      `processing activity ${activity.data || 'unknown'} recipients`,
      activity.recipients,
      issues,
    )
  }
  const activityNames = profile.privacy.processingActivities.map((activity) =>
    activity.data.trim().toLowerCase(),
  )
  if (new Set(activityNames).size !== activityNames.length) {
    issues.push('Legal profile contains duplicate processing activity data labels.')
  }

  const providers = [
    ...profile.privacy.serviceProviders,
    ...(profile.features.analytics ? [profile.features.analytics] : []),
  ]
  for (const provider of providers) {
    if (!provider.name.trim() || !provider.purpose.trim()) {
      issues.push('Every declared legal provider requires a name and purpose.')
    }
  }
  if (profile.features.analytics) {
    const analytics = profile.features.analytics
    if (!analytics.data.trim() || !analytics.legalBasis.trim() || !analytics.retention.trim()) {
      issues.push('Analytics requires data, legalBasis, and retention disclosures.')
    }
  }

  return Array.from(new Set(issues))
}

export function buildLegalDocument(
  kind: LegalDocument['kind'],
  profile: LegalProfile,
): LegalDocument {
  return kind === 'privacy' ? buildPrivacyDocument(profile) : buildTermsDocument(profile)
}

function buildPrivacyDocument(profile: LegalProfile): LegalDocument {
  const analyticsParagraph = profile.features.analytics
    ? `${profile.features.analytics.name} is used only after the visitor grants analytics consent. It processes ${profile.features.analytics.data} for ${profile.features.analytics.purpose}, relies on ${profile.features.analytics.legalBasis}, and retains that information for ${profile.features.analytics.retention}.`
    : 'The Service does not currently use optional analytics.'
  const providers = uniqueProviders([
    ...profile.privacy.serviceProviders,
    ...(profile.features.analytics ? [profile.features.analytics] : []),
  ])

  return {
    kind: 'privacy',
    title: 'Privacy Policy',
    description: `This policy explains how ${profile.productName} handles information and which product capabilities affect that handling.`,
    sections: [
      {
        id: 'scope',
        title: '1. Scope and operator',
        paragraphs: [
          `${profile.operatorName} operates ${profile.productName} at ${profile.siteUrl}. This policy applies to the website and product experiences that link to it.`,
          'Supported tool inputs are processed in the browser. The local tool workflow does not intentionally upload or persist those inputs on the operator’s servers.',
        ],
      },
      {
        id: 'processing',
        title: '2. Information we process and why',
        paragraphs: [
          'Each processing activity is listed with its purpose, legal basis, retention rule, and recipients:',
        ],
        items: profile.privacy.processingActivities.map(formatProcessingActivity),
      },
      {
        id: 'browser-storage',
        title: '3. Cookies and analytics',
        paragraphs: [
          'The Service uses only the browser storage declared below. Optional analytics remains off until consent is granted.',
          analyticsParagraph,
        ],
        items: profile.privacy.browserStorage,
      },
      {
        id: 'providers',
        title: '4. Service providers and international processing',
        paragraphs: [
          'Service providers may process limited information on behalf of the operator. The Service does not sell personal information or share it for cross-context behavioral advertising.',
          profile.privacy.internationalTransfers,
        ],
        items: providers.map((provider) => `${provider.name}: ${provider.purpose}`),
      },
      {
        id: 'retention',
        title: '5. Retention',
        paragraphs: [
          'Retention is stated for each processing activity above. Browser-local tool inputs are not intentionally retained by the operator.',
        ],
      },
      {
        id: 'rights',
        title: '6. Your choices and rights',
        paragraphs: [
          `You may request access, correction, deletion, restriction, portability, or objection where applicable. You may withdraw optional analytics consent using the footer control. Send privacy requests to ${profile.contactEmail}.`,
        ],
      },
      {
        id: 'children',
        title: '7. Children',
        paragraphs: [
          `${profile.productName} is intended for a general audience and is not directed to children. The operator does not knowingly collect children’s personal information through the local tool workflow.`,
        ],
      },
      {
        id: 'changes-contact',
        title: '8. Changes and contact',
        paragraphs: [
          'Material changes will be reflected on this page by updating the date above. We will provide additional notice when required by the change or applicable law.',
          `For privacy questions or requests, contact ${profile.operatorName} at ${profile.contactEmail}.`,
        ],
      },
    ],
  }
}

function buildTermsDocument(profile: LegalProfile): LegalDocument {
  return {
    kind: 'terms',
    title: 'Terms of Service',
    description: `These terms explain the basic rules for using ${profile.productName}, an unofficial browser-based Fortnite Sprite collection aid.`,
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance',
        paragraphs: [
          `By accessing or using ${profile.productName}, you agree to these terms. If you do not agree, please stop using the Service.`,
        ],
      },
      {
        id: 'service',
        title: '2. The Service and your collection data',
        paragraphs: [
          `${profile.productName} is a free, unofficial, account-free collection tracker and informational resource available at ${profile.siteUrl}. It does not connect to your Epic Games account or read your in-game inventory.`,
          'Collection progress and preferences are stored locally in your browser and are not intentionally uploaded to an FN Sprite Hub account or database. Local data may be lost if you clear browser storage, reset the browser, or change devices. You are responsible for keeping any export or backup that matters to you.',
        ],
      },
      {
        id: 'accuracy',
        title: '3. Game information and accuracy',
        paragraphs: [
          `Fortnite is a live service and may change without notice. Sprite availability, variants, rarity, abilities, locations, and other information may become outdated or contain errors. ${profile.productName} is not an official source of Fortnite data. Verify time-sensitive information in the game or through official Epic Games announcements.`,
        ],
      },
      {
        id: 'acceptable-use',
        title: '4. Acceptable use',
        paragraphs: ['You may not misuse the Service. In particular, you must not:'],
        items: [
          'break applicable law or violate another person’s rights;',
          'probe, disrupt, overload, or bypass security or usage controls;',
          'introduce malware or distribute harmful material;',
          'scrape the Service abusively or generate fraudulent, automated, or invalid analytics or advertising traffic;',
          `present ${profile.productName} as an official or Epic Games-endorsed service.`,
        ],
      },
      {
        id: 'third-party-services',
        title: '5. Third-party services and advertising',
        paragraphs: [
          'The Service may link to third-party websites or display third-party content or advertising. Their inclusion does not imply endorsement by FN Sprite Hub or Epic Games. Third-party services are governed by their own terms and privacy practices.',
        ],
      },
      {
        id: 'intellectual-property',
        title: '6. Fortnite and intellectual property',
        paragraphs: [
          `${profile.productName} is an unofficial fan-made resource and is not affiliated with, endorsed by, or sponsored by Epic Games. Fortnite and related names, trademarks, artwork, and materials belong to Epic Games or their respective rights holders. Their appearance identifies the subject of this resource and does not transfer ownership to ${profile.productName} or its users.`,
          `${profile.productName}'s original software, written content, interface, and branding remain the property of ${profile.operatorName} or its licensors. Exporting or sharing an image does not grant additional rights to reuse third-party material contained in it. Rights holders may report a concern to ${profile.contactEmail}.`,
        ],
      },
      {
        id: 'availability',
        title: '7. Availability, liability, and changes',
        paragraphs: [
          'The Service is provided on an “as available” basis without a promise of uninterrupted or error-free operation. To the extent permitted by law, the operator is not responsible for lost browser data, game progress, service interruptions, third-party services, or decisions based on outdated information. Rights and responsibilities that cannot legally be limited remain unaffected.',
          'The Service and these terms may change as the product develops. The updated date above identifies the current version.',
          `Questions about these terms may be sent to ${profile.contactEmail}.`,
        ],
      },
    ],
  }
}

function formatProcessingActivity(activity: LegalProcessingActivity): string {
  return `${withoutTrailingPunctuation(activity.data)} — Purpose: ${withoutTrailingPunctuation(activity.purpose)}; legal basis: ${withoutTrailingPunctuation(activity.legalBasis)}; retention: ${withoutTrailingPunctuation(activity.retention)}; recipients: ${activity.recipients.join(', ')}.`
}

function withoutTrailingPunctuation(value: string): string {
  return value.trim().replace(/[.;:]$/, '')
}

function uniqueProviders(providers: ReadonlyArray<LegalProvider>): LegalProvider[] {
  const byName = new Map<string, LegalProvider>()
  for (const provider of providers) {
    const key = provider.name.trim().toLowerCase()
    const existing = byName.get(key)
    byName.set(
      key,
      existing ? { ...existing, purpose: `${existing.purpose}; ${provider.purpose}` } : provider,
    )
  }
  return [...byName.values()]
}

function validateList(field: string, values: ReadonlyArray<string>, issues: string[]) {
  if (values.length === 0) issues.push(`Legal profile ${field} must not be empty.`)
  const normalized = values.map((value) => value.trim().toLowerCase())
  if (normalized.some((value) => !value))
    issues.push(`Legal profile ${field} contains an empty item.`)
  if (new Set(normalized).size !== normalized.length) {
    issues.push(`Legal profile ${field} contains duplicate items.`)
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
}
