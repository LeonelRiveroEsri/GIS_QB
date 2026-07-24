import { type IMThemeVariables, css, type SerializedStyles } from 'jimu-core'

export function getStyle (theme: IMThemeVariables): SerializedStyles {
  const bgColor = theme.sys.color.surface?.paper
  let height = '65px'
  let minHeight = '200px'
  let maxHeight = '250px'
  let maxWidth = '220px'
  if (theme.ref.typeface.htmlFontSize === '125%') {
    height = '95px'
    minHeight = '240px'
    maxHeight = '290px'
    maxWidth = '260px'
  } else if (theme.ref.typeface.htmlFontSize === '87.5%') {
    height = '60px'
    minHeight = '180px'
    maxHeight = '235px'
    maxWidth = '205px'
  } else if (theme.ref.typeface.htmlFontSize === '75%') {
    height = '55px'
    minHeight = '175px'
    maxHeight = '210px'
    maxWidth = '190px'
  }

  return css`
    overflow: visible;
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
    pointer-events: none;

    &.ep-root-paper {
      background-color: transparent !important;
      box-shadow: none !important;
      border: none !important;
    }

    .widget-elevation-profile {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
      background-color: transparent;
      pointer-events: none;

      .ep-floating-panel {
        pointer-events: auto;
        position: fixed;
        top: 12px;
        left: 12px;
        width: min(1180px, calc(100vw - 24px));
        height: min(760px, calc(100vh - 24px));
        min-height: 460px;
        overflow: hidden;
        z-index: 1800;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(0, 0, 0, 0.18);
        border-radius: 14px;
        background-color: rgba(255, 255, 255, 0.94);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
        backdrop-filter: blur(6px);
        transition: width 0.22s ease, height 0.22s ease;
      }

      .ep-floating-panel.is-collapsed {
        width: min(660px, calc(100vw - 40px));
        height: 62px;
        min-height: 62px;
      }

      .ep-floating-panel.is-start {
        width: min(660px, calc(100vw - 40px));
        height: auto;
        min-height: 0;
      }

      .ep-floating-panel.is-drawing {
        top: auto;
        left: 20px;
        bottom: 20px;
        width: min(760px, calc(100vw - 40px));
        height: auto;
        min-height: 0;
      }

      .ep-floating-panel.is-maximized {
        top: 10px;
        left: 10px;
        bottom: auto;
        width: calc(100vw - 20px);
        height: calc(100vh - 20px);
        min-height: 0;
      }

      &.is-controller-window {
        height: 100%;
        min-height: 280px;
        pointer-events: auto;
      }

      .ep-floating-panel.is-controller-window {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        min-height: 0;
        max-height: none;
        border-radius: 0;
        border: none;
        box-shadow: none;
        background-color: rgba(255, 255, 255, 0.96);
        backdrop-filter: none;
      }

      .ep-floating-panel.is-controller-window.is-start,
      .ep-floating-panel.is-controller-window.is-drawing,
      .ep-floating-panel.is-controller-window.is-collapsed,
      .ep-floating-panel.is-controller-window.is-maximized {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .ep-floating-panel.is-controller-window .ep-floating-panel-grip {
        display: none;
      }

      .ep-floating-panel.is-controller-window .ep-floating-panel-actions {
        display: none;
      }

      .ep-floating-panel-grip {
        width: 44px;
        height: 6px;
        flex: 0 0 auto;
        padding: 0;
        margin: 8px auto 4px auto;
        border: none;
        border-radius: 999px;
        background: var(--sys-color-divider-primary);
        cursor: pointer;
      }

      .ep-floating-panel-titlebar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 48px;
        padding: 8px 16px;
        user-select: none;
        border-bottom: 1px solid var(--sys-color-divider-secondary);
        background-color: transparent;
        color: var(--sys-color-surface-paper-text);
      }

      .ep-floating-panel-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--sys-color-surface-paper-text);
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 700;
        font-size: 14px;
      }

      .ep-floating-panel-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 0 0 auto;
      }

      .ep-floating-panel-toggle {
        cursor: pointer;
        min-width: 28px;
        height: 26px;
        font-size: 16px;
        line-height: 1;
      }

      .ep-floating-panel-content {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        background: transparent;
      }

      .ep-profile-start {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        min-height: 0;
        height: auto;
        padding: 18px 24px 24px 24px;
      }

      .ep-profile-start-card {
        width: 100%;
        padding: 0;
        border: none;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

      .ep-profile-start-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--sys-color-surface-paper-text);
      }

      .ep-profile-start-desc {
        margin-top: 8px;
        color: var(--sys-color-surface-paper-text);
        opacity: 0.75;
        line-height: 1.4;
      }

      .ep-profile-start-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .ep-drawing-compact {
        position: relative;
        padding: 14px 16px 12px 16px;
        background: transparent;
      }

      .ep-drawing-message {
        margin-bottom: 10px;
      }

      .ep-drawing-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .ep-floating-panel.is-collapsed .ep-floating-panel-titlebar {
        border-bottom: none;
      }

      .ep-floating-panel.is-collapsed .ep-floating-panel-content {
        display: none;
      }

      .userGuideInfo {
        font-weight: 400;
        overflow-y: auto;
        height: ${height};
      }

      .front-section {
        min-width: ${theme.ref.typeface.htmlFontSize === '75%' ? '180px' : '200px'};
        min-height: ${minHeight};
        max-height: ${maxHeight};
        max-width: ${maxWidth};
      }

      .front-cards {
        border-radius: 7px;
        background-color: var(--sys-color-surface-overlay);
      }

      .hidden {
        display: none;
      }

      .mainSection {
        padding: 20px;
      }

      .adjust-cards {
        gap: 2px 35px;
        width: 100%;
        max-height: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
      }

      .loading-text {
        position: absolute;
        top: 50%;
        left: 50%;
        text-align: center;
        transform: translate(-50%, 50%);
        font-size: var(--calcite-font-size--2);
        color: var(--calcite-color-text-1);
      }
  `
}

export function getExportOptionsStyle (theme: IMThemeVariables): SerializedStyles {
  let unitsLabelMargin = '3px 8px 2px 12px'
  if (theme.ref.typeface.htmlFontSize === '125%') {
    unitsLabelMargin = '0px 8px 2px 10px'
  } else if (theme.ref.typeface.htmlFontSize === '87.5%') {
    unitsLabelMargin = '4px 8px 2px 13px'
  } else if (theme.ref.typeface.htmlFontSize === '75%') {
    unitsLabelMargin = '5px 8px 2px 14px'
  }
  return css`
    .actionButton {
      margin: 2px 0px 2px 5px;
    }

    .exportHintStyle {
      font-style: italic;
    }

    .exportLabel {
      margin: 0 !important;
      font-weight: 500;
    }

    .showCustomizeEdit {
      display: block;
    }

    .hideCustomizeEdit {
      display: none;
    }

    .style-setting--unit-selector {
      width: 50px;
      margin-left: 0px;
      background: var(--sys-color-divider-secondary);
      color: var(--sys-color-surface-paper-text);
      height: 26px;
    }

    .unitsLabel {
      margin: ${unitsLabelMargin};
      border-radius: 0px;
      color: var(--sys-color-surface-paper-text);
    }

    .invalidRange {
      font-style: italic;
      color: ${theme.sys.color.error.main};
    }

    .invalidValue {
      height: 28px!important;
      border: 1px solid  ${theme.sys.color.error.main};
      box-shadow: 0 0 1px  ${theme.sys.color.error.main};
    }
  `
}

export function getContainerStyle (theme: IMThemeVariables): SerializedStyles {
  let bodyHeight = 'calc(100% - 106px)'
  if (theme.ref.typeface.htmlFontSize === '125%') {
    bodyHeight = 'calc(100% - 118px)'
  } else if (theme.ref.typeface.htmlFontSize === '87.5%') {
    bodyHeight = 'calc(100% - 100px)'
  } else if (theme.ref.typeface.htmlFontSize === '75%') {
    bodyHeight = 'calc(100% - 94px)'
  }
  return css`
    .ep-widget-header {
      border-bottom: 1px solid ${theme.sys.color.divider.secondary};
      overflow: visible;

      .chart-actions {
        float: right;
        width: 32px;
        height: 32px;
        margin: 2px 5px 2px 5px;
      }

      .profile-tooltip-header {
        display: flex;
        align-items: center;
        gap: 8px;
        width: calc(100% - 180px);
        max-height: 66px;
        overflow: hidden;
        padding: 4px 8px 0 8px;
        line-height: 1.3;
        color: ${theme.sys.color.surface.paperText};
      }

      .profile-delta-box {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
        min-width: 104px;
        min-height: 32px;
        padding: 3px 10px;
        border: 1px solid ${theme.sys.color.divider.primary};
        background-color: ${theme.sys.color.surface.paper};
        color: ${theme.sys.color.surface.paperText};
      }

      .profile-delta-label {
        font-weight: 500;
      }

      .profile-compare-selectors {
        display: grid;
        grid-template-columns: repeat(4, minmax(120px, 1fr));
        gap: 6px;
        min-width: 0;
        width: min(900px, 100%);
      }

      .profile-compare-selectors .jimu-dropdown,
      .profile-compare-selectors .jimu-select {
        min-width: 0;
      }

      .profile-tooltip-item {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 100%;
        font-size: 13px;
        white-space: nowrap;
      }

      .profile-tooltip-marker {
        display: inline-block;
        flex: 0 0 auto;
        width: 15px;
        height: 2px;
        margin: 0 5px 0 0;
        background-color: ${theme.sys.color.surface.paperText};
      }

      .profile-tooltip-label {
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 260px;
      }

      .profile-tooltip-value {
        margin-left: 4px;
      }
    }

    .ep-widget-bodyContainer {
      height: ${bodyHeight};
      min-height: 0;
      overflow: hidden;

      .alignInfo {
        padding-right: 40px;
        padding-left: 40px;
      }

      .userInfo .left-part {
        font-weight: 400;
      }

      .cancel-button-pos {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 3000;
        transform: translate(-50%, 25px);
      }

      .loading-scrim {
        background-color: ${theme.sys.color.mode === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
      }
    }

    .floatingInfoMsg {
      .alignDismissibleInfo {
        position: absolute;
        left: 53px;
        width: calc(100% - 109px);
        z-index: 1;
        bottom: 55px;
        margin: 0 auto;
      }

      .alignDismissibleInfo .left-part .text-left {
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        display: -webkit-box;
        font-weight: 400;
      }

      .showMessage {
        display: flex;
      }

      .hideMessage {
        display: none;
      }
    }

    .ep-widget-footer {
      line-height: 1.3;
      background-color: unset;
      border: 1px solid ${theme.sys.color.divider.secondary};
      width: calc(100% - 9px);
      margin-left: 4px;

      .hidden {
        display: none;
      }

      .footer-display {
        display: inline-block;
      }

      .actionButton {
        float: right;
      }
    }
  `
}

export function geSettingsOptionsStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
  .settingsLabel {
    margin: 0 !important;
    font-weight: 500;
  }

  .selectLayerWarningMsg {
    padding: 1px !important;
    background-color: transparent !important;
    border: none !important;
    font-size: 11px;
  }

  .selectLayerWarningMsg .left-part {
    color: var(--sys-color-warning-dark) !important;
    margin-right: 0 !important;
  }

  .custom-multiselect .jimu-dropdown .jimu-btn .dropdown-button-content {
    padding-top: 3px;
    padding-bottom: 3px;
  }
  `
}

export function getChartStyle (theme: IMThemeVariables): SerializedStyles {
  return css`
    .ep-shadow {
      box-shadow: 0 0 8px 3px rgba(0,0,0,0.2)!important;
    }

    .ep-legend {
      height: 100px;
      overflow-y: auto;
    }

    .ep-legend-section {
      border-radius: 2px;
      padding: 5px;
      margin-top: 10px;
      min-width: 120px;
    }

    .cursor-pointer {
      cursor: pointer
    }

    .legendLabel {
      margin-bottom: 0px;
      font-weight: bold;
      word-wrap: break-word;
    }

    .stat-content {
      display: block;
      padding: 12px 15px;
      padding-top: 0;
    }

    .profile-statistics {
      --max-width: 105px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(var(--max-width), 1fr));
      gap: 2px 22px;
      width: 100%;
    }

    .statistic-info {
      display: block;
      text-align: start;
    }

    .statistic-label {
      font-weight: 500;
    }
  `
}
