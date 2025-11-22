// booking-status.js

const tableBody = document.getElementById("tourTableBody");

const getBookingDetails = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const tourId = params.get("tourId");

    if (!tourId) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Không tìm thấy tourId</td></tr>`;
      return;
    }

    // Fetch bookings
    const bookingsRes = await fetch(`http://localhost:3000/bookings`);
    if (!bookingsRes.ok) throw new Error("Không lấy được bookings");
    const bookings = await bookingsRes.json();

    // Lấy bookings của đúng tour
    const tourBookings = bookings.filter(b => String(b.tourId) === String(tourId));

    // Fetch users
    const usersRes = await fetch(`http://localhost:3000/users`);
    if (!usersRes.ok) throw new Error("Không lấy được users");
    const users = await usersRes.json();

    // Fetch staffs
    const staffsRes = await fetch(`http://localhost:3000/staffs`);
    if (!staffsRes.ok) throw new Error("Không lấy được staffs");
    const staffs = await staffsRes.json();

    // Fetch tours
    const toursRes = await fetch(`http://localhost:3000/tours`);
    if (!toursRes.ok) throw new Error("Không lấy được tours");
    const tours = await toursRes.json();

    const currentTour = tours.find(t => String(t.id) === String(tourId));

    // Áp dụng Bootstrap bg-color cho các select status
const updateStatusColors = () => {
  document.querySelectorAll(".status-select").forEach(select => {
    const setColor = () => {
      select.classList.remove("bg-success", "bg-danger", "text-white");
      if (select.value === "Đã cọc") select.classList.add("bg-success", "text-white"); // xanh lá
      else select.classList.add("bg-danger", "text-white"); // đỏ
    };
    select.addEventListener("change", setColor);
    setColor(); // áp dụng ngay khi load
  });
};

// Gọi ngay sau renderBookings
renderBookings(tourBookings, users, staffs, currentTour);
updateStatusColors();


  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:red;">${error.message}</td></tr>`;
  }
};

const renderBookings = (bookings, users, staffs, tour) => {
  tableBody.innerHTML = "";

  if (bookings.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#999;">Tour chưa có booking</td></tr>`;
    return;
  }

  bookings.forEach((b, index) => {
    const user = users.find(u => u.id === b.userId);

    // Hiển thị role bình thường, nhưng không ảnh hưởng quyền sửa
    let roleLabel = "";
    if (user.role === "admin") roleLabel = "Admin";
    else if (staffs.some(s => s.id === user.id)) roleLabel = "Người đăng kí";
    else roleLabel = "Người dùng";

    // Ai cũng được chỉnh trạng thái
    const canEdit = true;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.phone}</td>
      <td>
        <img src="${user.avatar}" style="width:50px;height:50px;border-radius:8px;object-fit:cover">
      </td>
      <td>${roleLabel}</td>
      <td>${b.travelType}</td>
      <td>${b.quantity}</td>

      <td>
        <select class="form-select form-select-sm status-select rounded-pill" 
                data-id="${b.id}"
                ${canEdit ? "" : "disabled"}>
            <option value="Đã cọc" ${b.status === "Đã cọc" ? "selected" : ""}>Đã cọc</option>
            <option class="rounded-pill" value="Chưa cọc" ${b.status === "Chưa cọc" ? "selected" : ""}>Chưa cọc</option>
        </select>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  addSaveButton();
};


const addSaveButton = () => {
  let oldBtn = document.getElementById("btnSaveBooking");
  if (oldBtn) oldBtn.remove();

  const btn = document.createElement("button");
  btn.id = "btnSaveBooking";
  btn.textContent = "Lưu thay đổi";
  btn.className = "btn btn-primary mt-3";

  tableBody.parentElement.appendChild(btn);

  btn.addEventListener("click", saveChanges);
};

const saveChanges = async () => {
  const selects = document.querySelectorAll(".status-select");

  for (let sel of selects) {
    const id = sel.dataset.id;
    const newStatus = sel.value;

    await fetch(`http://localhost:3000/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
  }

  alert("Đã lưu thay đổi!");
};

// Gọi load lần đầu
getBookingDetails();
