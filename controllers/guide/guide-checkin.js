// guide-checkin.js
const API_BASE = 'http://localhost:3000';

// Lấy thông tin guide hiện tại
const getCurrentGuide = () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return null;
  
  // Tìm guide trong staffs dựa vào email hoặc id
  return user;
};

// Lấy danh sách departures của guide hiện tại
const getGuideDepartures = async () => {
  try {
    const guide = getCurrentGuide();
    if (!guide) {
      alert('Không tìm thấy thông tin hướng dẫn viên!');
      return [];
    }

    // Lấy tất cả departures
    const res = await fetch(`${API_BASE}/departures`);
    const departures = await res.json();

    // Lấy thông tin guide từ staffs để so sánh
    const staffsRes = await fetch(`${API_BASE}/staffs`);
    const staffs = await staffsRes.json();
    
    // Tìm guide trong staffs (so sánh email hoặc name)
    const currentStaff = staffs.find(s => 
      s.email === guide.email || s.name === guide.username
    );

    if (!currentStaff) {
      console.warn('Không tìm thấy guide trong staffs');
      return [];
    }

    // Lọc departures theo guideId
    const guideDepartures = departures.filter(dep => 
      String(dep.guideId) === String(currentStaff.id)
    );

    return guideDepartures;
  } catch (error) {
    console.error('Lỗi khi lấy departures:', error);
    return [];
  }
};

// Lấy thông tin tour từ departure
const getTourInfo = async (tourId) => {
  try {
    const res = await fetch(`${API_BASE}/tours/${tourId}`);
    return await res.json();
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tour:', error);
    return null;
  }
};

// Lấy danh sách customers từ bookings của tour
const getCustomersByDeparture = async (departure) => {
  try {
    // Lấy tất cả bookings của tour này
    const bookingsRes = await fetch(`${API_BASE}/bookings?tourId=${departure.tourId}`);
    const bookings = await bookingsRes.json();

    // Lấy tất cả customers
    const customersRes = await fetch(`${API_BASE}/customers`);
    const allCustomers = await customersRes.json();

    // Lọc customers theo bookingId (so sánh cả string và number)
    const customers = allCustomers.filter(customer => 
      bookings.some(booking => String(booking.id) === String(customer.bookingId))
    );

    return customers;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khách hàng:', error);
    return [];
  }
};

// Render danh sách departures vào select
const renderDepartureSelect = async () => {
  const departures = await getGuideDepartures();
  const select = document.getElementById('departureSelect');

  if (departures.length === 0) {
    select.innerHTML = '<option value="">Không có chuyến khởi hành nào</option>';
    return;
  }

  // Lấy thông tin tour cho mỗi departure
  const departuresWithTour = await Promise.all(
    departures.map(async (dep) => {
      const tour = await getTourInfo(dep.tourId);
      return { ...dep, tourName: tour?.name || 'Tour không xác định' };
    })
  );

  select.innerHTML = '<option value="">-- Chọn chuyến khởi hành --</option>';
  departuresWithTour.forEach(dep => {
    const option = document.createElement('option');
    option.value = dep.id;
    option.textContent = `${dep.tourName} - ${dep.dateStart} đến ${dep.dateEnd}`;
    select.appendChild(option);
  });
};

// Render danh sách customers
const renderCustomers = async (departureId) => {
  const container = document.getElementById('customerListContainer');
  
  if (!departureId) {
    container.innerHTML = '<p class="text-muted">Vui lòng chọn chuyến khởi hành để xem danh sách khách hàng</p>';
    return;
  }

  container.innerHTML = '<p class="text-muted">Đang tải...</p>';

  try {
    // Lấy departure
    const depRes = await fetch(`${API_BASE}/departures/${departureId}`);
    const departure = await depRes.json();

    // Lấy customers
    const customers = await getCustomersByDeparture(departure);

    if (customers.length === 0) {
      container.innerHTML = '<p class="text-muted">Chưa có khách hàng nào trong chuyến này</p>';
      return;
    }

    // Render table
    const tableHTML = `
      <table class="table table-hover">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên khách hàng</th>
            <th>Giới tính</th>
            <th>Ngày sinh</th>
            <th>CMND/CCCD</th>
            <th>Phòng</th>
            <th>Trạng thái check-in</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map((customer, index) => `
            <tr id="customer-row-${customer.id}">
              <td>${index + 1}</td>
              <td><strong>${customer.name}</strong></td>
              <td>${customer.gender || '-'}</td>
              <td>${customer.birth || '-'}</td>
              <td>${customer.identity || '-'}</td>
              <td>${customer.room || '-'}</td>
              <td>
                ${customer.checkin 
                  ? '<span class="badge bg-success">Đã check-in</span>' 
                  : '<span class="badge bg-warning text-dark">Chưa check-in</span>'}
              </td>
              <td>
                <button 
                  class="btn btn-sm ${customer.checkin ? 'btn-secondary' : 'btn-primary'}" 
                  onclick="updateCheckin('${customer.id}', ${!customer.checkin})"
                  ${customer.checkin ? 'disabled' : ''}
                >
                  <i class="bi bi-${customer.checkin ? 'check-circle-fill' : 'check-circle'}"></i>
                  ${customer.checkin ? 'Đã check-in' : 'Check-in'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = tableHTML;
  } catch (error) {
    console.error('Lỗi khi render customers:', error);
    container.innerHTML = '<p class="text-danger">Lỗi khi tải danh sách khách hàng</p>';
  }
};

// API: Cập nhật trạng thái check-in
window.updateCheckin = async (customerId, status) => {
  try {
    // Lấy thông tin customer hiện tại
    const res = await fetch(`${API_BASE}/customers/${customerId}`);
    const customer = await res.json();

    // Cập nhật trạng thái check-in
    const updateRes = await fetch(`${API_BASE}/customers/${customerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        checkin: status
      })
    });

    if (updateRes.ok) {
      alert(`Check-in ${status ? 'thành công' : 'đã hủy'} cho khách hàng ${customer.name}!`);
      
      // Reload danh sách
      const departureId = document.getElementById('departureSelect').value;
      await renderCustomers(departureId);
    } else {
      alert('Lỗi khi cập nhật trạng thái check-in!');
    }
  } catch (error) {
    console.error('Lỗi khi update check-in:', error);
    alert('Lỗi khi cập nhật trạng thái check-in!');
  }
};

// Khởi tạo
document.addEventListener('DOMContentLoaded', async () => {
  // Hiển thị thông tin guide
  const guide = getCurrentGuide();
  if (guide) {
    document.getElementById('guideName').textContent = guide.username || 'HDV';
    document.getElementById('guideEmail').textContent = guide.email || '-';
    const avatarEl = document.getElementById('guideAvatar');
    if (guide.avatar) {
      avatarEl.innerHTML = `<img src="${guide.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
      avatarEl.textContent = (guide.username || 'HDV').charAt(0).toUpperCase();
    }
  }

  // Render departures
  await renderDepartureSelect();

  // Event listener cho select departure
  document.getElementById('departureSelect').addEventListener('change', async (e) => {
    const departureId = e.target.value;
    await renderCustomers(departureId);
  });

  // Toggle sidebar
  const btnToggle = document.getElementById('btnToggle');
  const sidebar = document.getElementById('sidebar');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
});

