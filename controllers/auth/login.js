// =========================
// TAB SWITCHING
// =========================
const tabs = document.querySelectorAll('.tab');
const forms = {
  login: document.getElementById('form-login'),
  register: document.getElementById('form-register'),
  forgot: document.getElementById('form-forgot')
};

tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  t.classList.add('active');

  const key = t.dataset.tab;
  Object.keys(forms).forEach(k => {
    forms[k].style.display = (k === key) ? 'block' : 'none';
  });

  ['login-msg','reg-msg','forgot-msg']
    .forEach(id => document.getElementById(id).textContent = '');
}));

// =========================
// HELPER: SHOW MESSAGE
// =========================
function showMsg(id, text, type='error'){
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = type === 'error' ? 'error' : 'success';
}

// ====================================================
// LOGIN (using json-server /users?username&password)
// ====================================================
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  showMsg('login-msg','');

  const identifier = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!identifier || !password){
    showMsg('login-msg','Vui lòng nhập đủ thông tin');
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/users?email=${identifier}&password=${password}`);
    const users = await res.json();

    if (users.length === 0){
      showMsg('login-msg','Email hoặc mật khẩu sai');
      return;
    }

    const user = users[0];

    localStorage.setItem('currentUser', JSON.stringify(user));
    showMsg('login-msg','Đăng nhập thành công!', 'success');

    setTimeout(() => {
      window.location.href = '/admin/dashboard.html';
    }, 700);

  } catch (err){
    showMsg('login-msg','Lỗi kết nối server');
  }
});

// ====================================================
// REGISTER (POST /users)
// ====================================================
document.getElementById('form-register').addEventListener('submit', async e => {
  e.preventDefault();
  showMsg('reg-msg','');

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const p1 = document.getElementById('reg-password').value;
  const p2 = document.getElementById('reg-password2').value;

  if (!name || !email || !p1){
    showMsg('reg-msg','Vui lòng nhập đầy đủ');
    return;
  }
  if (p1.length < 6){
    showMsg('reg-msg','Mật khẩu tối thiểu 6 ký tự');
    return;
  }
  if (p1 !== p2){
    showMsg('reg-msg','Mật khẩu không khớp');
    return;
  }

  try {
    // check email exists
    const check = await fetch(`http://localhost:3000/users?email=${email}`);
    const exists = await check.json();

    if (exists.length > 0){
      showMsg('reg-msg','Email đã được sử dụng');
      return;
    }

    // create new user
    const newUser = {
      username: name,
      email: email,
      password: p1,
      role: "user",
      avatar: "img/default.jpg"
    };

    await fetch('http://localhost:3000/users', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(newUser)
    });

    showMsg('reg-msg','Đăng ký thành công! Mời bạn đăng nhập', 'success');
    document.querySelector('.tab[data-tab="login"]').click();

  } catch (err){
    showMsg('reg-msg','Lỗi kết nối server');
  }
});

// reset button
document.getElementById('reg-reset').addEventListener('click', () => {
  ['reg-name','reg-email','reg-password','reg-password2'].forEach(id => {
    document.getElementById(id).value = '';
  });
  showMsg('reg-msg','');
});

// ====================================================
// FORGOT PASSWORD (fake logic)
// ====================================================
document.getElementById('form-forgot').addEventListener('submit', async e => {
  e.preventDefault();
  showMsg('forgot-msg','');

  const email = document.getElementById('forgot-email').value.trim();
  if (!email){
    showMsg('forgot-msg','Vui lòng nhập email');
    return;
  }

  // check email exists
  const res = await fetch(`http://localhost:3000/users?email=${email}`);
  const data = await res.json();

  if (data.length === 0){
    showMsg('forgot-msg','Email không tồn tại');
    return;
  }

  // fake success
  showMsg('forgot-msg','Đã gửi email đặt lại mật khẩu!', 'success');
});

document.getElementById('forgot-cancel').addEventListener('click', () => {
  document.querySelector('.tab[data-tab="login"]').click();
});

// ====================================================
// REMEMBER IDENTIFIER
// ====================================================
window.addEventListener('load', () => {
  const saved = localStorage.getItem('auth-identifier');
  if (saved) document.getElementById('login-email').value = saved;
});
