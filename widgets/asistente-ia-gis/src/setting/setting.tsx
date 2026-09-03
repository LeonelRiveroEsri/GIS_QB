import { React } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { Label, NumericInput, Switch, TextArea, TextInput } from 'jimu-ui'
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import type { IMConfig } from '../config'
import defaultMessages from './translations/default'

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
  const t = (id: string) => props.intl.formatMessage({ id, defaultMessage: defaultMessages[id] })
  const update = (key: string, value: unknown) => props.onSettingChange({
    id: props.id,
    config: props.config.set(key, value)
  })

  return <div className='p-3'>
    <Label className='font-weight-bold mb-2'>{t('selectMap')}</Label>
    <MapWidgetSelector
      useMapWidgetIds={props.useMapWidgetIds}
      onSelect={(ids) => props.onSettingChange({ id: props.id, useMapWidgetIds: ids })}
    />

    <div className='border-top mt-4 pt-3'>
      <h6>{t('appearance')}</h6>
      <Label className='mt-2'>{t('widgetTitle')}</Label>
      <TextInput value={props.config.widgetTitle || ''} onChange={(event) => update('widgetTitle', event.target.value)} />
      <Label className='mt-3'>{t('welcomeMessage')}</Label>
      <TextArea rows={4} value={props.config.welcomeMessage || ''} onChange={(event) => update('welcomeMessage', event.target.value)} />
    </div>

    <div className='border-top mt-4 pt-3'>
      <h6>{t('behavior')}</h6>
      <Label className='d-flex align-items-center justify-content-between mt-3'>
        <span className='mr-3'>{t('includeMapContext')}</span>
        <Switch checked={props.config.includeMapContext} onChange={(_, checked) => update('includeMapContext', checked)} />
      </Label>
      <div className='text-muted small mt-1'>{t('includeMapContextHelp')}</div>
      <Label className='mt-3'>{t('maxContextLayers')}</Label>
      <NumericInput
        min={1}
        max={100}
        value={props.config.maxContextLayers || 20}
        onChange={(value) => update('maxContextLayers', Math.max(1, Math.min(100, Number(value) || 20)))}
      />
    </div>

    <div className='border-top mt-4 pt-3'>
      <h6>{t('agentConnection')}</h6>
      <Label className='d-flex align-items-center justify-content-between mt-3'>
        <span className='mr-3'>{t('enableCopilotStudio')}</span>
        <Switch
          checked={props.config.copilotStudio?.enabled === true}
          onChange={(_, checked) => props.onSettingChange({
            id: props.id,
            config: props.config.setIn(['copilotStudio', 'enabled'], checked)
          })}
        />
      </Label>
      <div className='text-muted small mt-1'>{t('enableCopilotStudioHelp')}</div>
      <Label className='mt-3'>{t('copilotEndpoint')}</Label>
      <TextArea
        rows={4}
        value={props.config.copilotStudio?.endpoint || ''}
        onChange={(event) => props.onSettingChange({
          id: props.id,
          config: props.config.setIn(['copilotStudio', 'endpoint'], event.target.value.trim())
        })}
      />
      <Label className='mt-3'>{t('timeoutMs')}</Label>
      <NumericInput
        min={1000}
        max={120000}
        value={props.config.copilotStudio?.timeoutMs || 30000}
        onChange={(value) => props.onSettingChange({
          id: props.id,
          config: props.config.setIn(['copilotStudio', 'timeoutMs'], Math.max(1000, Math.min(120000, Number(value) || 30000)))
        })}
      />
    </div>

    <div className='border-top mt-4 pt-3'>
      <h6>{t('entraAuthentication')}</h6>
      <Label className='d-flex align-items-center justify-content-between mt-3'>
        <span className='mr-3'>{t('enableEntraAuth')}</span>
        <Switch
          checked={props.config.auth?.enabled === true}
          onChange={(_, checked) => props.onSettingChange({
            id: props.id,
            config: props.config.setIn(['auth', 'enabled'], checked)
          })}
        />
      </Label>
      <div className='text-muted small mt-1'>{t('entraAuthHelp')}</div>
      <Label className='mt-3'>{t('tenantId')}</Label>
      <TextInput
        value={props.config.auth?.tenantId || ''}
        onChange={(event) => props.onSettingChange({
          id: props.id,
          config: props.config.setIn(['auth', 'tenantId'], event.target.value.trim())
        })}
      />
      <Label className='mt-3'>{t('clientId')}</Label>
      <TextInput
        value={props.config.auth?.clientId || ''}
        onChange={(event) => props.onSettingChange({
          id: props.id,
          config: props.config.setIn(['auth', 'clientId'], event.target.value.trim())
        })}
      />
      <Label className='mt-3'>{t('redirectUri')}</Label>
      <TextInput
        value={props.config.auth?.redirectUri || ''}
        placeholder='https://localhost:3001/'
        onChange={(event) => props.onSettingChange({
          id: props.id,
          config: props.config.setIn(['auth', 'redirectUri'], event.target.value.trim())
        })}
      />
      <Label className='mt-3'>{t('scopes')}</Label>
      <TextArea
        rows={3}
        value={props.config.auth?.scopes?.join('\n') || ''}
        placeholder='Un scope por línea'
        onChange={(event) => props.onSettingChange({
          id: props.id,
          config: props.config.setIn(['auth', 'scopes'], event.target.value
            .split(/[\n,]/)
            .map(scope => scope.trim())
            .filter(Boolean))
        })}
      />
      <div className='text-muted small mt-1'>{t('scopesHelp')}</div>
    </div>
  </div>
}

export default Setting
