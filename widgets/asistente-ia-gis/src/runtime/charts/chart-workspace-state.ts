import type { AgentArtifact, ChartAgentArtifact } from '../../types/agent-artifact'
import { createChartPresentationState, type ChartPresentationState } from './chart-presentation-state'

interface ArtifactLike {
  id: string
  type: string
}

interface MessageLike {
  id: string
  artifacts?: readonly ArtifactLike[]
}

export const getChartArtifactKeys = (messages: readonly MessageLike[]): string[] => messages.flatMap(message =>
  (message.artifacts || [])
    .filter(artifact => artifact.type === 'chart')
    .map(artifact => `${message.id}:${artifact.id}`)
)

interface ArtifactMessage {
  artifacts?: readonly AgentArtifact[]
}

export interface ChartWorkspaceState {
  latestChartArtifact?: ChartAgentArtifact
  chartRevision: number
  presentationState?: ChartPresentationState
}

export const INITIAL_CHART_WORKSPACE_STATE: ChartWorkspaceState = { chartRevision: 0 }

export const getLatestChartArtifact = (messages: readonly ArtifactMessage[]): ChartAgentArtifact | undefined => {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex--) {
    const artifacts = messages[messageIndex].artifacts || []
    for (let artifactIndex = artifacts.length - 1; artifactIndex >= 0; artifactIndex--) {
      const artifact = artifacts[artifactIndex]
      if (artifact.type === 'chart') return artifact
    }
  }
  return undefined
}

export const applyChartArtifactVersion = (
  current: ChartWorkspaceState,
  artifact: ChartAgentArtifact
): ChartWorkspaceState => current.latestChartArtifact === artifact
  ? current
  : {
      latestChartArtifact: artifact,
      chartRevision: current.chartRevision + 1,
      presentationState: createChartPresentationState(
        artifact,
        current.latestChartArtifact?.id === artifact.id ? current.presentationState : undefined,
        current.latestChartArtifact?.chartType || artifact.chartType
      )
    }