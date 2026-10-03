# Замена офиса на город — yelnur.pages.dev

Проект Pages `yelnur` уже связан с `Ye1nurN/virtual-office`. Сохраняем этот проект и его адрес, меняем папку приложения с `office-demo` на `city-demo`.

## Параметры Cloudflare Pages

Workers & Pages → **yelnur** → Settings → Build / Builds & deployments → Build configuration → Edit.

| Поле | Значение |
| --- | --- |
| Repository | `Ye1nurN/virtual-office` |
| Production branch | `master` |
| Framework preset | `Vite` / `React (Vite)`; если такого пункта нет — `None` |
| Root directory | `city-demo` |
| Build command | `npm run build` |
| Build output directory | `dist/client` |
| Environment variable | `NODE_VERSION=22.16.0` |

Сохранить настройки. В Deployments повторить публикацию **последнего коммита, содержащего `city-demo`**, через Retry deployment. Если настроены Build watch paths, включить `city-demo/*` вместо ограничения только на `office-demo/*`.

`dist/client` указывается относительно Root directory; не добавляйте к нему `city-demo/` повторно. Отдельная Deploy command в Pages не нужна. Если кабинет требует `npx wrangler deploy`, открыт раздел Workers: вернитесь именно в Pages-проект `yelnur`.

## Проверка после успешной публикации

- `https://yelnur.pages.dev/` — главная портфолио.
- `https://yelnur.pages.dev/?view=collection` — проекты на полках.
- `https://yelnur.pages.dev/?view=city` — город.
- `https://yelnur.pages.dev/?place=pharmacy` — аптека с локальным сценарием заявки и ботами.
- `https://yelnur.pages.dev/?place=office` — сохранённый четырёхэтажный офис.
- `https://yelnur.pages.dev/models.html` — каталог моделей.

Данные демонстрационные; сервер CRM, реальные бронирования и платежи не подключены. Оригинальное приложение в `../office-demo` сохранено.

## Готовая локальная сборка

`dist/client` содержит статический сайт. `dist/yelnur-city.zip`, если подготовлен, содержит тот же сайт с `index.html` в корне архива. `dist` не включается в Git: Cloudflare собирает приложение из исходников.

Для существующего проекта с Git-интеграцией загрузка ZIP через кабинет не поддерживается. Альтернатива смене Build configuration — загрузить готовую папку через Wrangler после входа в нужный аккаунт:

```sh
# Выполнять из city-demo с Node.js 22.16.0 или новее.
npx wrangler login
npx wrangler pages deploy dist/client --project-name yelnur --branch master
```

Для постоянных обновлений всё равно исправьте Root directory: следующая автоматическая сборка использует настройки кабинета.

Документация: [параметры сборки](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Git-интеграция](https://developers.cloudflare.com/pages/configuration/git-integration/), [ограничения Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).
