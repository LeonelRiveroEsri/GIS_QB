export interface Config {
  webmapId?: string
}

export type IMConfig = import('jimu-core').ImmutableObject<Config>
