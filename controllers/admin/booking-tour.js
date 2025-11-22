// booking-tour.js

const tableBody = document.getElementById("tourTableBody");

const getBookingsToursDepartures = async () => {
  try {
    // Lấy danh sách tours
    const toursRes = await fetch('http://localhost:3000/tours');
    if (!toursRes.ok) throw new Error('Không lấy được danh sách tour');
    const tours = await toursRes.json();

    // Lấy danh sách bookings
    const bookingsRes = await fetch('http://localhost:3000/bookings');
    if (!bookingsRes.ok) throw new Error('Không lấy được danh sách booking');
    const bookings = await bookingsRes.json();

    // Lấy danh sách departures
    const depRes = await fetch('http://localhost:3000/departures');
    if (!depRes.ok) throw new Error('Không lấy được danh sách departures');
    const departures = await depRes.json();

    renderBookings(tours, bookings, departures);

  } catch (error) {
    console.error('Lỗi tải dữ liệu:', error);
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;">Lỗi tải dữ liệu</td></tr>`;
  }
};

const renderBookings = (tours, bookings, departures) => {
  tableBody.innerHTML = '';

  // Lọc tours có departures tương ứng
  const toursWithDepartures = tours.filter(tour => 
    departures.some(dep => String(dep.tourId) === String(tour.id))
  );

  toursWithDepartures.forEach((tour, index) => {
    // Tổng quantity của tất cả booking cùng tourId
    const totalQuantity = bookings
      .filter(b => String(b.tourId) === String(tour.id))
      .reduce((sum, b) => sum + b.quantity, 0);

    const maxPeople = tour["max_people"];



    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${tour.type}</td>
      <td>${tour.name}</td>
      <td>${tour.main_destination}</td>
      <td>
        <img src="${tour.images[0]}" alt="${tour.name}" style="width:100px;height:60px;object-fit:cover;border-radius:4px;">
      </td>
      <td>${totalQuantity} / ${maxPeople}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="window.location.href='booking-status.html?tourId=${tour.id}'">Xem</button>

      </td>
    `;
    tableBody.appendChild(tr);
  });

  if (toursWithDepartures.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#999;">Chưa có tour nào có departure</td></tr>`;
  }
};

// Các hàm hành động (ví dụ)
const confirmTour = async (tourId) => alert(`Xác nhận tour ${tourId}`);
const cancelTour = async (tourId) => alert(`Hủy tour ${tourId}`);

// Gọi load lần đầu
getBookingsToursDepartures();
