# Constitution — POS Omnichannel

## Nguyên tắc bắt buộc

1. Không dùng float cho tiền tệ — toàn bộ tính toán dùng số nguyên VNĐ (cents) hoặc BigInt.
2. Không có circular reference trong BOM — phát hiện và chặn khi lưu.
3. Mobile app phải hoạt động offline hoàn toàn, sync khi có mạng (WatermelonDB + conflict resolution).
4. Mỗi store có warehouse riêng, dữ liệu cách ly theo store_id.
5. Mọi API mutation phải có RBAC middleware kiểm tra quyền — không bypass.
6. Không thêm dependency mới chưa hỏi người dùng.
7. Live Shopping API chỉ là research trong MVP v1 — không tích hợp vào production code.
8. Desktop Electron truy cập database trực tiếp qua better-sqlite3.

## Chất lượng code

- Typecheck: `tsc --noEmit` phải pass 0 error.
- Lint: `eslint "src/**/*.ts" --fix` phải pass 0 error.
- Test: `vitest run` — mọi module phải có unit test tương ứng.
- E2E: `npx playwright test` — mọi UI flow có Playwright test.

## Ràng buộc hiệu năng

- API endpoint < 300ms p95 (không tính network latency).
- BOM recursive tính giá vốn < 100ms cho nesting <= 3 cấp.
- Mobile sync < 5 giây cho < 1000 record.
- Chưa đặt ngưỡng hiệu năng cho AI prediction (chưa có số liệu base).
