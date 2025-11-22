// Lấy nút admin
const adminBtn = document.getElementById('adminButton');

// Ẩn nút admin nếu không phải admin 
const user = JSON.parse(localStorage.getItem('currentUser'));
if (!user || user.role !== 'admin') {
    adminBtn.style.display = 'none';
}// Click vào nút
adminBtn.addEventListener('click', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Kiểm tra xem user đã login chưa
    if (!currentUser) {
        // Chưa login: chuyển tới login với redirect về tour-list
        window.location.href = '/views/auth/login.html?redirect=/views/admin/tour-list.html';
        return;
    }

    // Đã login: kiểm tra role
    if (currentUser.role === 'admin') {
        window.location.href = '/views/admin/tour-list.html'; // chuyển trang admin
    } else {
        alert('Bạn không có quyền truy cập trang này!');
        // Quay lại home nếu không phải admin
        window.location.href = '/views/user/home.html';
    }
});
