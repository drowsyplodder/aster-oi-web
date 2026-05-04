# AsterDex Open Interest dashboard

Веб-фронт, показывающий открытый интерес по бессрочным фьючерсам [AsterDex](https://www.asterdex.com/) с дельтами Δ5m / Δ1h / Δ24h.

**Live:** https://drowsyplodder.github.io/aster-oi-web/

## Что внутри

- Vite + React 19 + TypeScript + Tailwind v4
- Чистый статический фронт — браузер ходит напрямую в `https://fapi.asterdex.com` (CORS открыт)
- История OI по каждому символу пишется в `localStorage` пользователя, дельты считаются по ближайшему по времени снапшоту
- OI в USDT отображается как сумма long + short (×2 от значения из API), ровно как на самой бирже
- Сортировка по любому столбцу, поиск по тикеру, фильтр по минимальному OI (`1M`, `500K`, `2.5B`), переключение Top 10 / 30 / 100 / All
- Авто-обновление: Off / 15s / 30s / 60s / 5m
- Ретраи + кэш цен, чтобы единичный сбой API не валил всю страницу

## Локальная разработка

```bash
npm install
npm run dev
```

## Production-сборка

```bash
npm run build       # собирает в dist/
npm run preview     # локально посмотреть билд
```

База путей по умолчанию `/aster-oi-web/` (под GitHub Pages в проектном репо). Чтобы собрать под корневой домен — `VITE_BASE_PATH=/ npm run build`.

## Деплой

GitHub Actions workflow `.github/workflows/deploy.yml` автоматически собирает и публикует `dist/` в GitHub Pages на каждый push в `main`. В Settings → Pages source должен быть выставлен **GitHub Actions**.
