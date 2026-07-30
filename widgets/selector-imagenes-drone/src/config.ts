import { type ImmutableObject } from 'seamless-immutable'

export interface Config {
  widgetTitle: string
  groupTitle: string
  datePattern: string
  autoSelectLatest: boolean
  zoomOnSelect: boolean
}

export type IMConfig = ImmutableObject<Config>
