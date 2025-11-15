const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const genre = document.getElementById("genre").value;
  const password = document.getElementById("password").value;

  // ----- Validate cơ bản -----
  if (!username || !email || !phone || !genre || !password) {
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Email không hợp lệ!");
    return;
  }

  const phoneRegex = /^\d{10,11}$/;
  if (!phoneRegex.test(phone)) {
    alert("Số điện thoại không hợp lệ!");
    return;
  }

  if (password.length < 6) {
    alert("Mật khẩu phải từ 6 ký tự trở lên!");
    return;
  }

  try {
    // ----- Lấy danh sách user hiện có để kiểm tra trùng -----
    const resUsers = await fetch("http://localhost:3000/users");
    const users = await resUsers.json();

    // Kiểm tra email
    if (users.some(u => u.email === email)) {
      alert("Email đã được sử dụng!");
      return;
    }

    // Kiểm tra số điện thoại
    if (users.some(u => u.phone === phone)) {
      alert("Số điện thoại đã được sử dụng!");
      return;
    }

    // ----- Hash password -----
    const hashedPassword = await hashPassword(password);

    const newUser = {
      username,
      email,
      phone,
      genre,
      password: hashedPassword,
      role: "user",
      avatar: "https://cdn2.fptshop.com.vn/small/avatar_trang_1_cd729c335b.jpg"
    };

    // ----- Lưu user -----
    const res = await fetch("http://localhost:3000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });

    if (!res.ok) throw new Error("Đăng ký thất bại!");

    alert("Đăng ký thành công!");
    window.location.href = "login.html";

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// ----- Hàm hash SHA-256 -----
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}