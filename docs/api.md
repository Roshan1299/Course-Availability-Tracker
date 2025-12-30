# API Documentation

## 🧠 API Design Philosophy

This API manages **long-running background monitors**, not one-off requests.

API calls are used to:
- create monitoring tasks
- control their execution (pause / resume / stop)
- observe their state over time

Seat checking happens asynchronously in the background.
Endpoints do not perform scraping synchronously.

---

## Core Resources

### Monitor
A long-running background task that:
- Periodically checks a course URL
- Tracks seat availability
- Maintains persistent state
- Emits notifications on changes

Monitors are stateful and survive server restarts.

### Monitor State

Each monitor exposes two independent dimensions:

- `mode`: user intent (active, paused, stopped)
- `health`: system state (healthy, stale, error)

This separation prevents user actions from being conflated with runtime failures.

---

## Monitor Management

### Create Monitor
- **Endpoint**: POST `/monitors`
- **Description**: Create and start a new background monitor
- **Side Effects**:
  - Allocates a browser context
  - Spawns an async monitoring task
  - Persists configuration to disk

### List Monitors
- **Endpoint**: GET `/monitors`
- **Description**: Returns all active monitors with:
  - last seen value
  - timestamps
  - mode and health

### Pause / Resume Monitor
- **Endpoint**: POST `/monitors/{id}/pause`
- **Endpoint**: POST `/monitors/{id}/resume`
- **Description**: Pausing a monitor suspends the monitoring loop
  without losing state or history.

### Stop Monitor
- **Endpoint**: DELETE `/monitors/{id}`
- **Description**: Stops monitoring permanently and removes persisted state.

---

## Notifications

### List Notifications
- **Endpoint**: GET `/notifications`
- **Description**: Returns a chronological history of seat changes.
  Each entry includes:
  - monitor ID
  - previous value
  - new value
  - timestamp

This enables auditability, UI history, and debugging.

---

## Error Handling

- A monitor in `error` state does not stop automatically
- Transient failures do not delete monitors
- API errors do not crash background tasks
- The system favors recoverability over strict failure

---

## 🔄 Typical Usage Flow

1. User creates a monitor via `POST /monitors`
2. Monitor begins checking in the background immediately
3. UI polls `GET /monitors` to display status
4. Notifications are emitted on seat changes
5. User may pause, resume, or stop monitors at any time