export type ModuleManifest = {
  id: 'email' | 'storage'
  version: string
  optional: boolean
  env: string[]
  tables: string[]
  routes: string[]
  securityBoundary: string
  dependsOn: string[]
  disable: string
  acceptance: string[]
}

export const moduleManifests: ModuleManifest[] = [
  {
    id: 'email',
    version: '0.1.0',
    optional: true,
    env: ['RESEND_API_KEY'],
    tables: [],
    routes: [],
    securityBoundary: 'Provider keys remain server-only and messages cross an adapter contract.',
    dependsOn: [],
    disable: 'Use disabledEmailAdapter.',
    acceptance: ['disabled adapter fails explicitly'],
  },
  {
    id: 'storage',
    version: '0.1.0',
    optional: true,
    env: ['R2_BUCKET'],
    tables: [],
    routes: [],
    securityBoundary: 'Object keys are provider-neutral and credentials remain server-only.',
    dependsOn: [],
    disable: 'Use disabledStorageAdapter.',
    acceptance: ['disabled reads return null'],
  },
]
