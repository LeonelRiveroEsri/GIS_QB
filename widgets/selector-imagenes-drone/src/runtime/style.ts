import { css } from 'jimu-core'

export const getStyle = () => css`
  --drone-ink: #17252a;
  --drone-muted: #66777d;
  --drone-line: #dce5e7;
  --drone-teal: #087f75;
  --drone-teal-dark: #075f59;
  --drone-soft: #e9f6f3;
  height: 100%;
  width: 100%;
  min-height: 300px;
  min-width: 0;
  overflow: hidden;
  position: relative;
  z-index: 2;
  isolation: isolate;
  color: var(--drone-ink);
  background: #fff;
  font-family: var(--ref-typeface-brand, "Avenir Next", Arial, sans-serif);

  * { box-sizing: border-box; }
  button, input { font: inherit; }

  .drone-shell { width: 100%; height: 100%; min-height: 0; overflow: hidden; display: flex; flex-direction: column; background: #fff; }
  .drone-header {
    flex: 0 0 auto;
    color: #fff;
    background: linear-gradient(135deg, #073f45 0%, #0a6c70 62%, #15877f 100%);
    padding: 20px 20px 17px;
    position: relative;
    overflow: hidden;
  }
  .drone-header::after {
    content: "";
    position: absolute;
    width: 150px; height: 150px;
    right: -65px; top: -80px;
    border: 28px solid rgba(255,255,255,.07);
    border-radius: 50%;
  }
  .drone-eyebrow { font-size: 11px; letter-spacing: .11em; text-transform: uppercase; opacity: .75; }
  .drone-heading { display: flex; align-items: center; gap: 11px; margin-top: 4px; }
  .drone-heading h2 { font-size: 20px; line-height: 1.2; margin: 0; font-weight: 700; }
  .drone-heading svg { flex: 0 0 auto; }
  .drone-summary { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 12px; }
  .drone-live { width: 7px; height: 7px; border-radius: 50%; background: #75e0b9; box-shadow: 0 0 0 4px rgba(117,224,185,.16); }

  .drone-toolbar { flex: 0 0 auto; padding: 14px 16px 12px; border-bottom: 1px solid var(--drone-line); background: #fff; }
  .drone-search { position: relative; }
  .drone-search svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #718087; pointer-events: none; }
  .drone-search input {
    width: 100%; height: 38px; border: 1px solid #cbd7da; border-radius: 7px;
    padding: 0 36px 0 35px; outline: none; color: var(--drone-ink); background: #fbfcfc;
  }
  .drone-search input:focus { border-color: var(--drone-teal); box-shadow: 0 0 0 2px rgba(8,127,117,.13); background: #fff; }
  .drone-clear-search { position: absolute; right: 4px; top: 3px; width: 32px; height: 32px; border: 0; background: transparent; color: #65767c; cursor: pointer; }
  .drone-year { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px; align-items: center; margin-top: 11px; }
  .drone-year span { font-size: 10px; font-weight: 700; color: var(--drone-muted); text-transform: uppercase; letter-spacing: .06em; }
  .drone-year select { width: 100%; height: 33px; border: 1px solid #cbd7da; border-radius: 6px; padding: 0 28px 0 9px; color: var(--drone-ink); background: #fff; }
  .drone-year select:focus { border-color: var(--drone-teal); box-shadow: 0 0 0 2px rgba(8,127,117,.13); outline: none; }
  .drone-range { display: grid; grid-template-columns: 1fr 12px 1fr; gap: 7px; align-items: end; margin-top: 11px; }
  .drone-range label { display: block; font-size: 10px; font-weight: 700; color: var(--drone-muted); text-transform: uppercase; letter-spacing: .06em; }
  .drone-range input { width: 100%; height: 33px; margin-top: 4px; border: 1px solid #cbd7da; border-radius: 6px; padding: 0 7px; color: var(--drone-ink); background: #fff; }
  .drone-dash { padding-bottom: 9px; color: #9aabad; text-align: center; }
  .drone-filter-meta { min-height: 27px; display: flex; align-items: end; justify-content: space-between; font-size: 11px; color: var(--drone-muted); }
  .drone-link { border: 0; padding: 2px 0; background: transparent; color: var(--drone-teal-dark); font-weight: 600; cursor: pointer; }

  .drone-list { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 8px 10px 14px; background: #f7f9f9; }
  .drone-card {
    position: relative; width: 100%; min-height: 82px; margin: 6px 0;
    border: 1px solid transparent; border-radius: 9px; background: #fff; color: inherit;
    box-shadow: 0 1px 2px rgba(25,50,56,.07); transition: border-color .15s, transform .15s, box-shadow .15s;
  }
  .drone-card:hover { border-color: #a8ceca; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(25,50,56,.09); }
  .drone-card.is-active { border-color: var(--drone-teal); box-shadow: 0 0 0 1px var(--drone-teal), 0 5px 14px rgba(8,127,117,.12); }
  .drone-card.is-compare { border-color: #9c7b30; background: #fffdf7; }
  .drone-card-select {
    width: 100%; min-height: 80px; display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 11px;
    padding: 11px 10px 31px; border: 0; border-radius: inherit; text-align: left; color: inherit; background: transparent; cursor: pointer;
  }
  .drone-date-box { width: 42px; height: 45px; border-radius: 7px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #edf3f3; color: #35545a; }
  .is-active .drone-date-box { background: var(--drone-soft); color: var(--drone-teal-dark); }
  .drone-day { font-size: 18px; font-weight: 750; line-height: 18px; }
  .drone-month { font-size: 9px; letter-spacing: .05em; text-transform: uppercase; margin-top: 3px; }
  .drone-card-main { display: block; min-width: 0; overflow: visible; }
  .drone-card-title { display: block; font-size: 13px; font-weight: 700; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .drone-card-sub { display: flex; align-items: center; gap: 5px; min-width: 0; min-height: 14px; margin-top: 6px; font-size: 10px; line-height: 1.35; color: var(--drone-muted); }
  .drone-layer-label { flex: 0 0 auto; padding-right: 5px; border-right: 1px solid #cbd7da; color: #49656b; font-size: 9px; font-weight: 750; letter-spacing: .05em; text-transform: uppercase; }
  .drone-layer-name { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .drone-badge { display: inline-block; border-radius: 10px; padding: 2px 7px; margin-top: 6px; font-size: 9px; font-weight: 750; text-transform: uppercase; letter-spacing: .04em; color: var(--drone-teal-dark); background: var(--drone-soft); }
  .drone-check { width: 22px; height: 22px; display: grid; place-items: center; border: 1px solid #c9d4d6; border-radius: 50%; color: transparent; }
  .is-active .drone-check { color: #fff; border-color: var(--drone-teal); background: var(--drone-teal); }
  .is-compare .drone-check { color: #fff; border-color: #9c7b30; background: #9c7b30; }
  .drone-opacity {
    position: absolute; right: 9px; bottom: 7px; min-width: 54px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    padding: 0 7px; border: 1px solid #c7d4d6; border-radius: 11px;
    color: #486168; background: #f7f9f9; font-size: 10px; font-weight: 700; cursor: pointer;
  }
  .drone-opacity:hover, .drone-opacity:focus-visible { color: #fff; border-color: var(--drone-teal); background: var(--drone-teal); outline: none; }
  .drone-opacity-icon { font-size: 13px; line-height: 1; }

  .drone-footer { flex: 0 0 auto; position: relative; z-index: 3; padding: 12px 16px 14px; border-top: 1px solid var(--drone-line); background: #fff; }
  .drone-nav { display: grid; grid-template-columns: 38px 1fr 38px; align-items: center; gap: 9px; }
  .drone-nav button { width: 38px; height: 36px; border: 1px solid #cbd7da; border-radius: 7px; color: #38555b; background: #fff; cursor: pointer; }
  .drone-nav button:hover:not(:disabled) { color: #fff; background: var(--drone-teal); border-color: var(--drone-teal); }
  .drone-nav button:disabled { opacity: .35; cursor: default; }
  .drone-position { text-align: center; font-size: 11px; color: var(--drone-muted); }
  .drone-position strong { display: block; color: var(--drone-ink); font-size: 13px; margin-bottom: 2px; }
  .drone-compare-row { display: flex; justify-content: space-between; align-items: center; margin-top: 11px; padding-top: 11px; border-top: 1px solid #e5ebec; }
  .drone-compare-copy strong { display: block; font-size: 12px; }
  .drone-compare-copy span { display: block; font-size: 10px; color: var(--drone-muted); margin-top: 2px; }
  .drone-toggle { position: relative; width: 38px; height: 21px; border: 0; border-radius: 12px; padding: 0; background: #bcc8ca; cursor: pointer; }
  .drone-toggle:disabled { opacity: .45; cursor: not-allowed; }
  .drone-toggle::after { content: ""; position: absolute; width: 17px; height: 17px; left: 2px; top: 2px; border-radius: 50%; background: #fff; transition: left .15s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
  .drone-toggle.on { background: var(--drone-teal); }
  .drone-toggle.on::after { left: 19px; }
  .drone-swipe-status { margin-top: 10px; padding: 7px 9px; border-radius: 6px; font-size: 10px; font-weight: 650; color: var(--drone-teal-dark); background: var(--drone-soft); text-align: center; }
  .drone-compare-summary { display: grid; grid-template-columns: minmax(0,1fr) 22px minmax(0,1fr); gap: 5px; align-items: center; margin-top: 9px; padding: 8px; border: 1px solid var(--drone-line); border-radius: 7px; text-align: center; background: #f7f9f9; }
  .drone-compare-summary.active { border-color: #8fc6c1; background: var(--drone-soft); }
  .drone-compare-summary span { min-width: 0; }
  .drone-compare-summary small, .drone-compare-summary strong { display: block; }
  .drone-compare-summary small { color: var(--drone-muted); font-size: 8px; text-transform: uppercase; }
  .drone-compare-summary strong { margin-top: 2px; color: var(--drone-teal-dark); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .drone-compare-summary > b { color: var(--drone-teal); }

  .drone-state { height: 100%; min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px; text-align: center; color: var(--drone-muted); }
  .drone-state svg { color: #7d969b; margin-bottom: 13px; }
  .drone-state strong { color: var(--drone-ink); margin-bottom: 5px; }
  .drone-spinner { width: 28px; height: 28px; margin-bottom: 15px; border: 3px solid #dbe8e8; border-top-color: var(--drone-teal); border-radius: 50%; animation: drone-spin .8s linear infinite; }
  @keyframes drone-spin { to { transform: rotate(360deg); } }

  @media (max-width: 300px) {
    .drone-header { padding: 16px; }
    .drone-toolbar { padding-left: 10px; padding-right: 10px; }
    .drone-card { grid-template-columns: 39px 1fr auto; gap: 8px; }
    .drone-date-box { width: 38px; }
  }

  @media (max-height: 960px) {
    .drone-header { padding: 13px 16px 11px; }
    .drone-heading h2 { font-size: 18px; }
    .drone-summary { margin-top: 8px; }
    .drone-toolbar { padding: 10px 12px 8px; }
    .drone-range { margin-top: 7px; }
    .drone-filter-meta { min-height: 23px; }
    .drone-list { padding: 5px 8px 8px; }
    .drone-card { min-height: 68px; margin: 4px 0; }
    .drone-card-select { min-height: 66px; padding: 8px 8px 28px; }
    .drone-date-box { height: 41px; }
    .drone-card-sub { margin-top: 3px; }
    .drone-badge { margin-top: 3px; }
    .drone-footer { padding: 8px 12px 10px; }
    .drone-compare-row { margin-top: 7px; padding-top: 7px; }
    .drone-swipe-status { margin-top: 6px; padding: 5px 8px; }
  }

  @media (max-height: 720px) {
    .drone-eyebrow, .drone-summary, .drone-compare-copy span { display: none; }
    .drone-heading { margin-top: 0; }
    .drone-header { padding-top: 10px; padding-bottom: 10px; }
    .drone-range input { height: 30px; }
    .drone-card { min-height: 60px; }
    .drone-card-select { min-height: 58px; }
    .drone-footer { padding-top: 6px; padding-bottom: 7px; }
  }
`
