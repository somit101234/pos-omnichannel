# Research Brief: POS Omnichannel MVP

**Spec:** .specify/specs/001-POS-Omnichannel-MVP/spec.md

## 1. Hiện trạng nội bộ

- Dự án **greenfield**: thư mục `pos-omnichannel/` chỉ có `.git` và `.specify/` với các subdir rỗng.
- Không có code sản phẩm sẵn để verify. Chỉ có `.specify/specs/001-POS-Omnichannel-MVP/spec.md` đã được PM viết với 16 US, 80 FR, 8 Actors.
- `.specify/memory/constitution.md` vừa được tạo ở bước này.
- Không có ADR nào trong repo.
- Không có code cũ từ `quan-ly-kinh-doanh` — spec yêu cầu "chỉ đọc docs làm tham khảo", không tái sử dụng code.

## 2. Luật / quy định

- **Luật hóa đơn điện tử (VN):** Hóa đơn thermal (58mm/80mm) có thể cần tuân thủ thông tư 78/2021/TT-BTC (hoá đơn điện tử có chữ ký số). Tuy nhiên, trong MVP v1, hóa đơn thermal chỉ in ra thiết bị cục bộ (không qua máy chủ hóa đơn điện tử), nên **không áp dụng luật hóa đơn điện tử bắt buộc** — chỉ cần template in cơ bản.
- **Bảo vệ dữ liệu cá nhân (Luật 06/2022/QH15):** System thu thập username/password, dữ liệu khách hàng, nhân viên. Cần:
  - Mã hóa password (bcrypt/argon2) — bắt buộc.
  - JWT token có thời hạn ngắn, refresh token cơ chế.
  - Audit log cho mọi thay đổi quan trọng (tài khoản, giá cả, refund).
- **Dữ liệu tài chính:** Tính tiền dùng số nguyên (không float) — không phải luật nhưng là best practice để tránh floating-point error.

## 3. Hệ thống tương tự

- **Square POS (Square Inc.):** Reference architecture cho multi-store POS. Backend NestJS/Node.js, frontend React, mobile React Native. Offline mode dùng local SQLite sync.
- **Lightspeed Restaurant:** Multi-store architecture, per-store database partitioning, real-time sync qua WebSocket/Socket.io.
- **Shopify POS:** Online+offline sync pattern — local database (WatermelonDB/Realm) + background sync khi online.
- **Pattern đáng tham khảo:**
  - **Adapter pattern** cho platform import (Shopee/GrabFood/BeFood) — spec đã đề cập.
  - **Repository pattern** cho data access layer.
  - **CQRS-lite** cho reports/ai-prediction (read-optimized queries tách biệt từ write model).

## 4. UI/UX

- Spec yêu cầu Material-UI + Ant Design + Tailwind CSS. Đây là combo hợp lý:
  - **Material-UI:** components cơ bản (buttons, dialogs, tables).
  - **Ant Design:** table phức tạp, form, chart (báo cáo).
  - **Tailwind CSS:** utility classes cho layout, responsive, spacing.
- POS grid cần dark theme cho giảm mỏi mắt nhân viên.
- Mobile React Native dùng Expo — recommendation dùng @react-navigation cho routing, React Native Paper cho native components.
- Thermal printer: dùng `@mihai-nenciu/react-native-thermal-receipt-printer` cho mobile, `raw-thermal-printer` cho desktop Electron.

## 5. Công nghệ

### Backend — NestJS + PostgreSQL + Prisma
- **NestJS** (v10+): framework Angular-style, modular architecture, TypeScript-native. Phù hợp cho enterprise POS.
- **PostgreSQL**: relational DB mạnh, transaction support cho financial data, JSONB cho flexible fields.
- **Prisma ORM**: type-safe queries, auto-migration, sinh TypeScript types từ schema.

### Frontend — React + TypeScript + MUI + AntD + Tailwind
- **React 18+** với TypeScript strict mode.
- **Zustand**: state management đơn giản hơn Redux, phù hợp cho POS (cần performance).
- **React Router v6**: routing.
- **Socket.io client**: real-time updates (đơn hàng online, cảnh báo).

### Mobile — React Native (Expo) + Zustand + WatermelonDB
- **Expo SDK 50+**: managed workflow, dễ build + deploy.
- **WatermelonDB**: local database offline-first, sync với backend qua custom adapter.
- **React Navigation 6**: routing + deep linking.

### Desktop — Electron + better-sqlite3
- **Electron 28+**: truy cập filesystem, thermal printer driver.
- **better-sqlite3**: synchronous SQLite, nhanh hơn sql.js cho desktop.

### Real-time — Socket.io
- **Socket.io v4**: backend + client, hỗ trợ namespaces cho multi-store isolation.

### AI Prediction
- **Phase research**: Không triển khai trong MVP v1 code. Chỉ research API TikTok Shop, Youtube Shopping.
- **Phase 2+**: đề xuất `python3` microservice với `scikit-learn` / `statsmodels` (linear regression + ARIMA) hoặc `xgboost` cho thời gian thực.

### Database Schema — Multi-tenant
- **Option A:** Single DB, mọi table có `store_id` column (shared schema). Đơn giản, dễ query tổng hợp.
- **Option B:** Separate DB per store (schema-per-tenant). Cách ly tốt nhưng phức tạp khi Owner xem tổng hợp.
- **Khuyến nghị:** **Option A** với `store_id` trên mọi table liên quan. Owner queries dùng `WHERE store_id IN (...)`. Đơn giản cho MVP, scale tốt tới ~50 stores.

### Tiền tệ
- **Option A:** `DECIMAL(15,0)` (số nguyên VNĐ, không có phần thập phân). Đơn giản, không có rounding.
- **Option B:** `BIGINT` lưu cents (VNĐ × 100). Cần convert khi hiển thị.
- **Khuyến nghị:** **Option A** — `DECIMAL(15,0)` trong PostgreSQL, tương ứng `Int` hoặc `BigInt` trong Prisma. Đơn giản hơn, không cần multiply/divide 100.

## Phương án kiến trúc

| Phương án | Ưu điểm | Đánh đổi |
|---|---|---|
| A: Monolith (NestJS single process) | Đơn giản deploy, dev nhanh, shared code giữa frontend/backend types | Không scale được module lớn, nhưng MVP không cần |
| B: Microservices ( tách reports AI thành service riêng) | Tách biệt concerns, dễ scale AI component | Phức tạp deploy, network latency, overkill cho MVP |

**Khuyến nghị:** **Phương án A — Monolith NestJS** cho MVP v1. Có thể tách sau khi có dữ liệu production. Giảm complexity đáng kể cho team mới.

## Rủi ro / giả định cần xác nhận

1. **Số lượng store mục tiêu:** Spec ghi "≥5 cửa hàng". Cần xác nhận target tối đa để design capacity.
2. **Platform fee %:** Spec có FR-047 "platform_fee = price × fee%". Cần biết fee% thực tế của Shopee/GrabFood/BeFood để tính chính xác.
3. **AI Prediction ±5%:** Đây là SLR rất khó. Cần xác nhận: baseline là mô hình gì? Training data từ đâu?
4. **Offline sync conflict resolution:** Khi 2 thiết bị offline cùng sửa 1 product → conflict. Cần xác nhận strategy: last-write-wins? manual resolve?
