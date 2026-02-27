# Инструкция по откату к рабочей версии

## Проблема
Игрок заходит в комнату мгновенно, минуя процесс создания комнаты. Это произошло из-за добавления `MouseFollowerManager`, `BattleManager`, `VirusTubeManager` и `BattleRenderer`, которые инициализируются до завершения асинхронной операции создания/присоединения к комнате.

## Рабочие версии для отката

### Вариант 1: Версия v8 (рекомендуется)
**Коммит: `f7eb3e9`** (16 февраля 2026, 21:41)
- Ретро-неон дизайн
- Рабочая логика create/join room
- Нет проблемы с мгновенным заходом в комнату

```bash
git checkout f7eb3e9
```

### Вариант 2: Версия Fix Render deployment
**Коммит: `ab9d83b`** (16 февраля 2026, 17:07)
- Простая архитектура без лишних компонентов
- Минималистичный UI
- Стабильная работа комнат

```bash
git checkout ab9d83b
```

## Как создать ветку для работы

```bash
# Создать новую ветку от рабочей версии
git checkout -b rollback-fix f7eb3e9

# Или от версии ab9d83b
git checkout -b rollback-fix ab9d83b
```

## Проверка работы

1. Запустите сервер:
   ```bash
   cd server
   npm run dev
   ```

2. Запустите клиент в другом окне:
   ```bash
   cd client
   npm run dev
   ```

3. Откройте два браузера:
   - Браузер 1: нажмите "CREATE ROOM"
   - Браузер 2: введите ID комнаты и нажмите "JOIN ROOM"

4. Убедитесь, что:
   - Игрок 1 остаётся в комнате после создания
   - Игрок 2 присоединяется только после успешного join
   - Нет мгновенного переключения на gameScreen

## Что было сломано

В текущей версии (HEAD) в файле `client/src/main.ts`:

```typescript
// ❌ ПРОБЛЕМА: Эти компоненты инициализируются ДО завершения async операции
this.mouseFollower = new MouseFollowerManager(...);
this.battleRenderer = new BattleRenderer(...);
this.battleManager = new BattleManager(...);
this.virusTubeManager = new VirusTubeManager(...);

// В onCreateRoom:
this.mouseFollower.setupNetworkListeners();  // ← Вызывается слишком рано
this.mouseFollower.onRoomJoined(true, ...);  // ← Отправляет сетевые сообщения до готовности комнаты
```

## Решение для будущего

При добавлении новых компонентов, которые зависят от сети:
1. Дождитесь завершения `await networkManager.createRoom()` или `joinRoom()`
2. Убедитесь, что `networkManager.getCurrentRoom()` возвращает комнату
3. Только затем вызывайте `setupNetworkListeners()` и аналогичные методы
