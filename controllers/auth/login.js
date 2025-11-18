// Hàm thực hiện đăng nhập
const login = async (data) => {
  // Xóa token và thông tin user cũ (nếu có)
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');

  try {
    // Gửi yêu cầu đăng nhập tới server
    const res = await fetch(`http://localhost:3000/login`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const respon = await res.json();

    if (res.ok) {
      // Lưu token và thông tin user vào localStorage
      localStorage.setItem('token', respon.accessToken);
      localStorage.setItem('currentUser', JSON.stringify(respon.user));

      alert('Đăng nhập thành công!');

      // Lấy URL redirect (nếu có) từ query parameter
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');

      // Kiểm tra vai trò của user
      if (respon.user.role === 'admin') {
        // Nếu có redirect và là admin thì đi tới redirect
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          // Mặc định chuyển tới trang quản trị (Quản lý Tour)
          window.location.href = '/views/admin/tour-list.html';
        }
      } else {
        // Nếu không phải admin, chuyển về trang người dùng
        window.location.href = '/views/user/home.html';
      }

    } else {
      // Hiển thị lỗi trả về từ server (nếu có)
      alert(respon);
    }
  } catch (error) {
    console.log(error);
  }
}

// Hàm khởi tạo: bắt sự kiện submit form đăng nhập
const init = () => {
  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const iEmail = document.getElementById('email');
    const iPassword = document.getElementById('password');

    if (!iEmail.value.trim()) {
      alert('Vui lòng nhập email');
      iEmail.focus();
      return;
    }
    if (!iPassword.value.trim()) {
      alert('Vui lòng nhập mật khẩu');
      iPassword.focus();
      return;
    }

    const data = {
      email: iEmail.value,
      password: iPassword.value
    }

    login(data);
  })
}

init();

