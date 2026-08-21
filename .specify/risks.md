# Risk Register — POS Omnichannel MVP

| ID | Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R001 | Mobile offline sync conflict khi 2 thiết bị sửa cùng record | Medium | High | Last-write-wins strategy + notification user; manual resolve cho financial data | Dev2 |
| R002 | BOM recursive cost tính quá chậm khi nesting sâu | Low | Medium | Limit nesting max 3 cấp (đã enforce), cache computed cost | Dev1 |
| R003 | Decimal precision loss trong currency calculation | Low | High | Tất cả price dùng DECIMAL(15,0), unit test bắt float usage | Dev1 |
| R004 | Platform adapter Excel format thay đổi (Shopee/GrabFood) | Medium | Medium | Adapter pattern cho phép update từng platform độc lập | Dev2 |
| R005 | Socket.io real-time events lost khi server restart | Medium | Low | Event queue trong Redis/DB, replay khi reconnect | Dev2 |
| R006 | WatermelonDB sync performance chậm với >10K records | Low | High | Pagination trong sync query, chunk processing | Dev1 |
| R007 | Thermal printer không tương thích với một số model | Medium | Medium | Support raw ESC/POS command, config paper size | Dev2 |
