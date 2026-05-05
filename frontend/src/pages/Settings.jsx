import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';

export default function Settings() {
  return (
    <MainLayout title="Cài đặt hệ thống">
      <div className="grid three">
        <Card>
          <h2>Thông tin doanh nghiệp</h2>
          <p>
            Cấu hình tên công ty, logo, múi giờ và ngôn ngữ mặc định.
          </p>

          <button type="button" className="btn primary">
            Cập nhật
          </button>
        </Card>

        <Card>
          <h2>Bảo mật</h2>
          <p>
            Quản lý chính sách mật khẩu, SSO và xác thực hai lớp.
          </p>

          <button type="button" className="btn ghost">
            Xem cài đặt
          </button>
        </Card>

        <Card>
          <h2>Thông báo</h2>
          <p>
            Thiết lập email, cảnh báo lương, nghỉ phép và đồng bộ dữ liệu.
          </p>

          <button type="button" className="btn ghost">
            Tùy chỉnh
          </button>
        </Card>
      </div>
    </MainLayout>
  );
}