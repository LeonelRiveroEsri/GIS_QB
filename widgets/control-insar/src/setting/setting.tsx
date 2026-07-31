import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { Label, NumericInput, TextInput } from 'jimu-ui'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import type { IMConfig } from '../config'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const update = (key: string, value: unknown) => props.onSettingChange({
    id: props.id,
    config: props.config.set(key, value)
  })

  return <div className='p-3'>
    <Label className='font-weight-bold mb-2'>Widget de mapa</Label>
    <MapWidgetSelector
      useMapWidgetIds={props.useMapWidgetIds}
      onSelect={(ids) => props.onSettingChange({ id: props.id, useMapWidgetIds: ids })}
    />
    <Label className='mt-4'>Título</Label>
    <TextInput value={props.config.widgetTitle || ''} onChange={(e) => update('widgetTitle', e.target.value)} />
    <Label className='mt-3'>Texto para identificar las capas</Label>
    <TextInput value={props.config.layerTitlePattern || 'DEFORMACION'} onChange={(e) => update('layerTitlePattern', e.target.value)} />
    <div className='small text-muted mt-1'>Se incluirán las FeatureLayers cuyo título contenga este texto.</div>
    <Label className='mt-3'>Máximo de registros por capa</Label>
    <NumericInput min={100} max={10000} value={props.config.maxRecordsPerLayer || 2000} onChange={(value) => update('maxRecordsPerLayer', value)} />
  </div>
}

export default Setting
