declare module 'plotly.js-dist-min' {
  const Plotly: unknown
  export default Plotly
}

declare module 'react-plotly.js/factory' {
  import type { ComponentType, CSSProperties } from 'react'

  interface PlotComponentProps {
    data: unknown[]
    layout: Record<string, unknown>
    config: Record<string, unknown>
    revision?: number
    useResizeHandler?: boolean
    style?: CSSProperties
  }

  const createPlotlyComponent: (plotly: unknown) => ComponentType<PlotComponentProps>
  export default createPlotlyComponent
}