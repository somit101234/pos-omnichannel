# Page Contract: Reports Page (Revenue Charts + Profit Table)

## ACTOR

**Actor:** Cashier, Manager, Owner  
**Quyền:** Truy cập route `/reports` sau khi đăng nhập

## PRECONDITION

- User đã đăng nhập thành công
- User có role là Cashier, Manager hoặc Owner
- Backend API trả về report data hợp lệ

## SUCCESS STATE

- Trang hiển thị:
  - Tiêu đề "Báo cáo doanh thu"
  - Nút "Xuất Excel" ở header
  - Filter bar với các tùy chọn: Hôm nay, 7 ngày, 30 ngày, Tùy chọn
  - 3 summary cards: Doanh thu, Lợi nhuận, Phí nền tảng
  - Biểu đồ line chart "Doanh thu và Lợi nhuận theo ngày"
  - Bảng chi tiết với các cột: Ngày, Doanh thu, Giá vốn, Lợi nhuận, Phí nền tảng, Tỷ lệ lợi nhuận
- Nút "Xuất Excel" -> tải xuống file CSV với header: `Date,Doanh thu,Lợi nhuận,Phí nền tảng`
- Click vào filter button -> change `dateRange` state, data được filter (mock không thực sự filter nhưng UI phản hồi)
- `npx tsc --noEmit` exit 0

## EMPTY STATE

- Nếu không có report data:
  - Table hiển thị: "Không có dữ liệu báo cáo"
  - Chart hiển thị: "Không có dữ liệu"
  - Summary cards hiển thị giá trị 0

## ERROR STATE

- Nếu API error:
  - Table hiển thị: "Lỗi khi tải dữ liệu"
  - Chart hiển thị: "Không thể hiển thị biểu đồ"
  - Summary cards hiển thị: "N/A"

## PRIMARY INTERACTION

1. User click filter button (Hôm nay/7 ngày/30 ngày/Tùy chọn)
2. User click nút "Xuất Excel"
3. Browser download file CSV

## NEGATIVE ORACLE

- Không có data khi có lỗi
- Không render component khi chưa mount
- Formatted currency đúng định dạng VND (integer)

## RESPONSIVE

- Table scrollable theo chiều dọc
- Summary grid responsive trên mobile (stack theo chiều dọc)
- Chart responsive theo chiều rộng container
