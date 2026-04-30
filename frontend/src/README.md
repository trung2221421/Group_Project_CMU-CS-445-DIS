# HR Payroll Integration Dashboard - React

Dự án này được chuyển từ 12 file HTML trong zip gốc sang React/Vite.

## Cấu trúc thư mục

```
hr-payroll-react/
  public/screens/              # ảnh screen.png gốc để đối chiếu UI
  src/
    components/
      RawHtmlScreen.jsx        # component render HTML tĩnh từng màn hình
    routes/
      screens.js               # danh sách route + map component
    screens/                   # mỗi màn hình là một React component riêng
    styles/
      app.css                  # CSS shell/preview của React app
    App.jsx                    # layout chọn màn hình
    main.jsx                   # entrypoint
  docs/DESIGN.md               # tài liệu thiết kế gốc nếu có
  index.html                   # Tailwind CDN + theme màu từ HTML gốc
```

## Chạy local

```bash
npm install
npm run dev
```

## Sửa lỗi nhanh

- Muốn sửa giao diện một màn hình: mở file trong `src/screens/<TenManHinh>.jsx`.
- Muốn thêm/xóa màn hình: sửa `src/routes/screens.js`.
- Muốn chỉnh khung điều hướng/preview: sửa `src/App.jsx` và `src/styles/app.css`.
- Muốn so sánh với ảnh HTML gốc: mở thư mục `public/screens/<slug>/screen.png` hoặc bấm nút "Xem ảnh gốc" trong app.

## Ghi chú

HTML gốc dùng Tailwind CDN và Material Symbols, nên bản React này giữ cấu hình đó trong `index.html` để hiển thị gần giống nhất với bản gốc.
