# Monitoring Lifecycle

This document details the technical flow of a single monitoring cycle in the Course Availability Tracker.

---

## 🔄 Monitoring Cycle Flow

Each monitor runs in a continuous loop that fetches data, compares it with the previous state, and takes appropriate actions.

![Runtime sequence diagram](diagrams/lifecycle-v1.png)

---

## 🧮 Detailed Cycle Steps

### 1. Fetch Phase
- Playwright browser navigates to the course URL
- Waits for page to fully load and JavaScript to execute
- Executes DOM queries to extract seat value
- Returns the seat value or None if not found

### 2. Compare Phase
- Compares fetched value with `last_seen` value
- Determines if a change has occurred
- Updates internal state based on comparison

### 3. Notify Phase
- If value changed and notifications enabled:
  - Creates email with course details
  - Sends notification via SMTP
- Logs the change to notification history

### 4. Persist Phase
- Updates `last_seen` if value changed
- Updates `last_changed_at` if value changed
- Updates `last_checked_at` for all cycles
- Updates `health` status based on cycle outcome
- Saves all state to disk atomically

---

## ⚡ Asynchronous Execution

Each monitor runs as an independent asyncio task, allowing:
- Multiple monitors to run concurrently
- Non-blocking I/O operations
- Efficient resource utilization
- Independent failure handling

---

## 🛡️ Error Handling

The system handles various failure modes:
- Network timeouts
- Page loading failures
- Element not found errors
- Browser crashes
- Email delivery failures

Errors are caught gracefully without stopping the monitoring service.

---

## 📊 State Transitions

During each cycle, the monitor can transition between different states:
- `healthy` → `stale` (when data not found)
- `healthy` → `error` (when exception occurs)
- `stale` → `healthy` (when data found again)
- `error` → `healthy` (when recovery occurs)

These transitions are automatically managed by the system.