# ACTOR
Người dùng muốn đăng nhập vào hệ thống POS Omnichannel

# PRECONDITION
- Server đang chạy trên port 3000
- Người dùng có tài khoản (username/password)

# SUCCESS STATE
Sau khi nhập đúng username và password, người dùng được chuyển hướng đến trang /dashboard. 
Giao diện dashboard hiển thị doanh thu hôm nay, số đơn hàng, và top 5 sản phẩm.

# EMPTY STATE
Form đăng nhập với hai trường:
- Username: rỗng
- Password: rỗng
Nút "Đăng nhập" bị disabled hoặc không thực hiện hành động.

# ERROR STATE
Nếu username hoặc password sai:
- Hiển thị thông báo lỗi màu đỏ: "Vui lòng nhập đầy đủ username và password" (nếu trống)
- Hoặc "Đăng nhập thất bại. Vui lòng thử lại." (nếu sai thông tin)
- Không chuyển hướng đến trang khác.

# PRIMARY INTERACTION
1. Người dùng điền username vào trường username
2. Người dùng điền password vào trường password
3. Người dùng bấm nút "Đăng nhập"
4. Hệ thống xử lý (500ms delay) và redirect nếu thành công

# NEGATIVE ORACLE
- Không cho phép trống username hoặc password
- Không cho phép đăng nhập với thông tin sai
- Không cho phép reload trang khi đang xử lý (isLoading=true)
