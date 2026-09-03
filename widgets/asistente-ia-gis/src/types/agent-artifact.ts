export type AgentArtifactType = 'pdf' | 'map' | 'image' | 'table' | 'link' | 'chart'
export type AgentArtifactMetadata = Record<string, string | number | boolean | null>

export interface ExternalAgentArtifact {
  id: string
  type: Exclude<AgentArtifactType, 'chart'>
  title: string
  url?: string
  metadata?: AgentArtifactMetadata
}

export interface ChartAgentArtifact {
  id: string
  type: 'chart'
  title: string
  chartType: 'line' | 'bar' | 'scatter' | 'area' | 'histogram' | 'donut'
  xField: string
  yField: string
  data: Array<Record<string, unknown>>
}

export type AgentArtifact = ExternalAgentArtifact | ChartAgentArtifact
