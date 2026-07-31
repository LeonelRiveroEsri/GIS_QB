import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  widgetTitle: string
  layerTitlePattern: string
  maxRecordsPerLayer: number
}

export type IMConfig = ImmutableObject<Config>
