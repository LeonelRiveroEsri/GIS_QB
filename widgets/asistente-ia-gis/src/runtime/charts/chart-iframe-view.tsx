import { React } from 'jimu-core'
import type { ChartAgentArtifact } from '../../types/agent-artifact'
import { isAllowedLocalChartUrl } from './local-chart-url'

interface ChartIframeViewProps {
  html?: string
  src?: string
  title?: string
  artifact?: ChartAgentArtifact
  revision?: number
}

const ChartIframeView = ({ html, src, title = 'Visualización HTML', artifact, revision = 0 }: ChartIframeViewProps) => {
  if (html) {
    return <iframe
      key={`chart-html-${revision}`}
      className='ai-chart-iframe'
      srcDoc={html}
      title={title}
      sandbox='allow-scripts'
      referrerPolicy='no-referrer'
    />
  }

  if (src && isAllowedLocalChartUrl(src)) {
    return <iframe
      className='ai-chart-iframe'
      src={src}
      title={title}
      sandbox='allow-scripts'
      referrerPolicy='no-referrer'
    />
  }

  return <div className='ai-chart-iframe-placeholder' role='status'>
    <strong>{artifact ? 'No fue posible generar la visualización HTML.' : 'Sin visualización HTML'}</strong>
    {!artifact && <span>Solicite un gráfico desde el chat para generar su representación HTML.</span>}
  </div>
}

export default ChartIframeView