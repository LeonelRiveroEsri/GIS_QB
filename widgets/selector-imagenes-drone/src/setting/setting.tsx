import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import { Label, TextInput, Switch } from 'jimu-ui'
import type { IMConfig } from '../config'
import defaultMessages from './translations/default'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const t = (id: string) => props.intl.formatMessage({
    id,
    defaultMessage: defaultMessages[id]
  })

  const update = (key: string, value: unknown) => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set(key, value)
    })
  }

  return <div className='p-3'>
    <Label className='font-weight-bold mb-2'>{t('selectMap')}</Label>
    <MapWidgetSelector
      useMapWidgetIds={props.useMapWidgetIds}
      onSelect={(ids) => props.onSettingChange({ id: props.id, useMapWidgetIds: ids })}
    />

    <div className='border-top mt-4 pt-3'>
      <h6>{t('appearance')}</h6>
      <Label className='mt-2'>{t('widgetTitle')}</Label>
      <TextInput
        value={props.config.widgetTitle || ''}
        placeholder='Imágenes drone'
        onChange={(evt) => update('widgetTitle', evt.target.value)}
      />
    </div>

    <div className='border-top mt-4 pt-3'>
      <h6>{t('source')}</h6>
      <Label className='mt-2'>{t('groupTitle')}</Label>
      <TextInput
        value={props.config.groupTitle}
        onChange={(evt) => update('groupTitle', evt.target.value)}
      />
      <div className='text-muted small mt-1'>{t('groupHelp')}</div>

      <Label className='mt-3'>{t('datePattern')}</Label>
      <TextInput
        value={props.config.datePattern}
        onChange={(evt) => update('datePattern', evt.target.value)}
      />
      <div className='text-muted small mt-1'>{t('patternHelp')}</div>
    </div>

    <div className='border-top mt-4 pt-3'>
      <h6>{t('behavior')}</h6>
      <Label className='d-flex align-items-center justify-content-between mt-3'>
        <span className='mr-3'>{t('autoLatest')}</span>
        <Switch
          checked={props.config.autoSelectLatest}
          onChange={(_, checked) => update('autoSelectLatest', checked)}
        />
      </Label>
      <Label className='d-flex align-items-center justify-content-between mt-3'>
        <span className='mr-3'>{t('zoomOnSelect')}</span>
        <Switch
          checked={props.config.zoomOnSelect}
          onChange={(_, checked) => update('zoomOnSelect', checked)}
        />
      </Label>
    </div>
  </div>
}

export default Setting
