import type { ChartAgentArtifact } from '../../types/agent-artifact'

export type SupportedChartType = ChartAgentArtifact['chartType']

export interface ChartPoint {
  label: string
  sourceX: string | number
  value: number
  sourceIndex?: number
  groupKey?: string
  groupCount?: number
  temporalStart?: number
  temporalEnd?: number
}

export interface TrendPoint {
  index: number
  value: number
}

export interface ProjectionPoint {
  position: number
  value: number
  xValue?: number
}

export interface LinearProjection {
  days: number
  endDate: Date
  estimatedValue: number
  points: [ProjectionPoint, ProjectionPoint]
}

export interface ChartGeometry {
  width: number
  height: number
  plotLeft: number
  plotRight: number
  plotTop: number
  plotBottom: number
  plotWidth: number
  plotHeight: number
  x: (index: number) => number
  continuousX?: (value: number) => number
  y: (value: number) => number
}

export interface ChartMarksProps {
  points: ChartPoint[]
  geometry: ChartGeometry
  trendPoints?: TrendPoint[]
  projectionPoints?: ProjectionPoint[]
}