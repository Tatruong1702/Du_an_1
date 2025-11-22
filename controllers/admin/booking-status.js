const user = JSON.parse(localStorage.getItem('currentUser'));
if (!user || user.role !== 'admin') {
  alert("Bạn không có quyền truy cập trang admin!");
  window.location.href = '/auth/login.html';
}

const loadBookingStatus = () => {
  Promise.all([
    fetch("http://localhost:3000/bookings").then(r => r.json()),
    fetch("http://localhost:3000/tours").then(r => r.json())
  ])
    .then(([bookings, tours]) => {
      const bookedMap = {};
      bookings.forEach(b => {
        const date = b.departureDate || "Chưa xác định";
        const key = `${b.tourId}-${date}`;
        const people = b.quantity || b.numberOfPeople || 1;
        bookedMap[key] = (bookedMap[key] || 0) + people;
      });

      renderBookingStatus(bookings, tours, bookedMap);
    })
    .catch(err => {
      console.error("Lỗi khi lấy dữ liệu:", err);
      alert("Không thể tải danh sách booking!");
    });
};

const renderBookingStatus = (bookings, tours, bookedMap) => {
  const tbody = document.getElementById("tourTableBody");
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Chưa có booking nào</td></tr>`;
    return;
  }

  const rows = bookings.map((b, i) => {
    const tour = tours.find(t => String(t.id) === String(b.tourId)) || {};
    const date = b.departureDate || "Chưa xác định";
    const key = `${b.tourId}-${date}`;
    const maxSeats = tour.max_people || 30;
    const booked = bookedMap[key] || 0;
    const remain = maxSeats - booked;

    const statusText = b.status || "Chưa xác định";
    let statusBadge = "";
    if (statusText.includes("Đã cọc")) statusBadge = `<span class="badge bg-warning text-dark">Đã cọc</span>`;
    else if (statusText.includes("Hoàn thành") || statusText.includes("Thành công")) statusBadge = `<span class="badge bg-success">Hoàn thành</span>`;
    else if (statusText.includes("Hủy") || statusText.includes("Huỷ")) statusBadge = `<span class="badge bg-danger">Đã hủy</span>`;
    else statusBadge = `<span class="badge bg-secondary">${statusText}</span>`;

    let remainText = `${remain} chỗ còn`;
    let rowClass = "";
    if (remain <= 0) { remainText = "HẾT CHỖ"; rowClass = "table-danger"; }
    else if (remain <= 5) { remainText = `${remain} chỗ (sắp hết)`; rowClass = "table-warning"; }

    return `
      <tr class="${rowClass}">
        <td>${i + 1}</td>
        <td>${tour.name || "Tour không tồn tại"}</td>
        <td>${b.email || "N/A"}</td>
        <td>${b.phone || "N/A"}</td>
        <td><img src="${tour.images?.[0] || '/assets/img/default-tour.jpg'}" width="60" class="rounded" alt=""></td>
        <td>${b.travelType || "Cá nhân"}</td>
        <td>${b.type || "Khách lẻ"}</td>
        <td>${b.quantity || b.numberOfPeople || 1}</td>
        <td>${statusBadge}<br><small class="text-muted">Còn ${remain} chỗ</small></td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = rows;
};

loadBookingStatus();