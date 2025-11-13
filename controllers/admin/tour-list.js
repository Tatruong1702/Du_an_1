fetch("http://localhost:3000/tours")
  .then(res => res.json())
  .then(tours => {
    const totalTours = tours.length;
    const el = document.getElementById("total-tours");
    if (el) el.textContent = `Số tour hiện có: ${totalTours}`;
  })
  .catch(err => {
    console.error("Lỗi khi lấy dữ liệu:", err);
  });

const getTour = async () => {
  try {
    const res = await fetch(`http://localhost:3000/tours`);
    const data = await res.json();
    console.log(data);
    renderTour(data)
  } catch (error) {
    console.log(error);
  }
}

getTour();

const renderTour = (list) => {
  const trLists = list.map((p, index) => {
    return `
      <tr>
        <th scope="row">${index + 1}</th>  
        <td>${p.type}</td>
        <td>${p.name}</td>
        <td>${p.main_destination}</td>
        <td><img src="${p.images && p.images[0] ? p.images[0] : '/assets/placeholder.jpg'}" width="160" height="100" alt=""></td>
        <td>${p.tour_code}</td>
        <td>${(p.price?.child ?? 0).toLocaleString()}~${(p.price?.adult ?? 0).toLocaleString()}đ</td>
        
        <td>
          <button onclick="handleDelete('${p.id}')" class="btn btn-danger"><i class="bi bi-trash3"></i></button>
          <a class="btn btn-info" href="edit.html?id=${p.id}"><i class="bi bi-pen"></i></a>
          <a class="btn btn-success" href="/views/admin/tour-detail.html?id=${p.id}"><i class="bi bi-box-arrow-in-up-right"></i></a>
        </td>
      </tr>
    `
  }).join('');

  const tbody = document.querySelector('tbody');
  if (tbody) tbody.innerHTML = trLists;
}

const handleDelete = async (id) => {
  if (window.confirm("Bạn có chắc chắn muốn xóa không")) {
    try {
      const res = await fetch(`http://localhost:3000/tours/${id}`, {
        method: 'delete'
      });
      if (res.ok) {
        alert("Xóa thành công");
        getTour(); // Reload list
      }
    } catch (error) {
      console.log(error);
    }
  }
}

// ========== GOOGLE MAPS ==========
let map;
let marker;
let selectedLocationName = '';
let currentScheduleItem = null;

const initMap = () => {
  const defaultLocation = [10.7769, 106.7009]; // Hồ Chí Minh [lat, lng]

  map = L.map('mapContainer').setView(defaultLocation, 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Click on map để đánh dấu
  map.on('click', (event) => {
    placeMarker(event.latlng);
  });
};

const placeMarker = (latlng) => {
  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker([latlng.lat, latlng.lng])
    .addTo(map)
    .bindPopup('Vị trí đã chọn')
    .openPopup();

  // gán tạm bằng toạ độ để tránh trường hợp người bấm xác nhận ngay
  selectedLocationName = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
  const elSel = document.getElementById('selectedLocation');
  if (elSel) elSel.textContent = selectedLocationName;

  // Reverse geocoding để lấy tên địa điểm (cập nhật sau)

  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`)


    .then(res => res.json())
    .then(data => {
      selectedLocationName = data?.address?.city || data?.address?.town || data?.display_name || selectedLocationName;
      if (elSel) elSel.textContent = selectedLocationName;
    })
    .catch(err => {
      console.log(err);
      // giữ selectedLocationName là tọa độ (đã set ở trên)
    });
};

// Hàm thêm tour
const handleAdd = async (data) => {
  try {
    // Lấy danh sách hiện có để tính id mới
    const listRes = await fetch('http://localhost:3000/tours');
    const list = await listRes.json();
    const numericIds = list
      .map(t => Number(t.id))
      .filter(n => Number.isInteger(n) && n > 0);
    const maxId = numericIds.length ? Math.max(...numericIds) : 0;
    data.id = String(maxId + 1);

    const res = await fetch('http://localhost:3000/tours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    console.log("Response status:", res.status);
    if (res.ok) {
      alert("Thêm tour thành công!");

      // Reset form if exists
      const addForm = document.getElementById('addTourForm');
      if (addForm) addForm.reset();

      const scheduleContainer = document.getElementById('scheduleContainer');
      if (scheduleContainer) {
        scheduleContainer.innerHTML = `
          <div class="schedule-item mb-3 p-3" style="background:#f9f7f0; border-radius:6px;">
            <div class="row mb-2">
              <div class="col-md-4">
                <label class="form-label">Ngày thứ</label>
                <input type="number" class="form-control schedule-day" placeholder="1" min="1">
              </div>
              <div class="col-md-6">
                <label class="form-label">Hoạt động</label>
                <input type="text" class="form-control schedule-activity" placeholder="VD: Đà Nẵng – Ngũ Hành Sơn – Hội An">
              </div>
              <div class="col-md-2">
                <label class="form-label">Bản đồ</label>
                <button type="button" class="btn btn-sm btn-primary w-100 btnMapLocation" data-bs-toggle="modal" data-bs-target="#mapModal">📍 Chọn</button>
              </div>
            </div>
          </div>
        `;
      }

      // Đóng modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addTourModal'));
      if (modal) modal.hide();

      // Reload
      getTour();
    } else {
      alert("Lỗi server: " + res.status);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Lỗi: " + error.message);
  }
}

// ========== THÊM TOUR - CHỈ CÓ MỘT DOMContentLoaded ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded");

  const form = document.getElementById('addTourForm');

  console.log("Form found:", form);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log("Form submitted!");

      const inputType = form.querySelector('select[name="type"]');
      const inputName = form.querySelector('input[name="name"]');
      const inputDestination = form.querySelector('input[name="main_destination"]');
      const inputImages = form.querySelector('input[name="images"]');
      const inputTourCode = form.querySelector('input[name="tour_code"]');
      const inputDescription = form.querySelector('textarea[name="short_description"]');
      const inputPriceAdult = form.querySelector('input[name="price_adult"]');
      const inputPriceChild = form.querySelector('input[name="price_child"]');
      const inputPolicyCancel = form.querySelector('textarea[name="policy_cancel"]');
      const inputPolicyRefund = form.querySelector('textarea[name="policy_refund"]');
      const inputSupplierHotel = form.querySelector('input[name="supplier_hotel"]');
      const inputSupplierRestaurant = form.querySelector('input[name="supplier_restaurant"]');
      const inputSupplierTransport = form.querySelector('input[name="supplier_transport"]');

      if (!inputType.value.trim()) {
        alert("Vui lòng chọn loại tour");
        inputType.focus();
        return;
      }
      if (!inputName.value.trim()) {
        alert("Vui lòng nhập tên tour");
        inputName.focus();
        return;
      }
      if (!inputDestination.value.trim()) {
        alert("Vui lòng nhập điểm đến chính");
        inputDestination.focus();
        return;
      }
      if (!inputPriceAdult.value.trim()) {
        alert("Vui lòng nhập giá người lớn");
        inputPriceAdult.focus();
        return;
      }
      if (!inputPriceChild.value.trim()) {
        alert("Vui lòng nhập giá trẻ em");
        inputPriceChild.focus();
        return;
      }

      const scheduleItems = document.querySelectorAll('.schedule-item');
      const schedule = Array.from(scheduleItems).map(item => ({
        day: parseInt(item.querySelector('.schedule-day').value) || 0,
        activity: item.querySelector('.schedule-activity').value,
        location: item.dataset.location || ''
      })).filter(s => s.day > 0 && s.activity.trim());

      const data = {
        type: inputType.value,
        name: inputName.value,
        tour_code: inputTourCode.value,
        main_destination: inputDestination.value,
        images: inputImages.value
          ? inputImages.value.split(',').map(url => url.trim()).filter(url => url)
          : [],
        short_description: inputDescription.value,
        price: {
          adult: Number(inputPriceAdult.value),
          child: Number(inputPriceChild.value)
        },
        policy: {
          cancel: inputPolicyCancel?.value || '',
          refund: inputPolicyRefund?.value || ''
        },
        supplier: {
          hotel: inputSupplierHotel?.value || '',
          restaurant: inputSupplierRestaurant?.value || '',
          transport: inputSupplierTransport?.value || ''
        },
schedule: schedule.length > 0 ? schedule : []
      };

      console.log("Data:", data);
      handleAdd(data);
    });
  } else {
    console.error("Form không tìm thấy - kiểm tra ID 'addTourForm'");
  }

  // ========== NÚT HỦY FORM ==========
  const cancelBtn = document.querySelector('.btn-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      // 1. Reset form
      if (form) {
        form.reset();
      }

      // 2. Reset lịch trình (xóa highlight + giá trị cũ)
      const scheduleContainer = document.getElementById('scheduleContainer');
      if (scheduleContainer) {
        scheduleContainer.innerHTML = `
          <div class="schedule-item mb-3 p-3" style="background:#f9f7f0; border-radius:6px;">
            <div class="row mb-2">
              <div class="col-md-4">
                <label class="form-label">Ngày thứ</label>
                <input type="number" class="form-control schedule-day" placeholder="1" min="1">
              </div>
              <div class="col-md-6">
                <label class="form-label">Hoạt động</label>
                <input type="text" class="form-control schedule-activity" placeholder="VD: Đà Nẵng – Ngũ Hành Sơn – Hội An">
              </div>
              <div class="col-md-2">
                <label class="form-label">Bản đồ</label>
                <button type="button" class="btn btn-sm btn-primary w-100 btnMapLocation" data-bs-toggle="modal" data-bs-target="#mapModal">📍 Chọn</button>
              </div>
            </div>
          </div>
        `;
      }

      // 3. Reset biến map
      selectedLocationName = '';
      currentScheduleItem = null;
      const selEl = document.getElementById('selectedLocation');
      if (selEl) selEl.textContent = 'Chưa chọn';

      // 4. Reset marker trên bản đồ
      if (marker && map) {
        map.removeLayer(marker);
        marker = null;
      }

      console.log("Form cleared!");
    });
  }

  // ========== NÚT THÊM NGÀY ==========
  const addScheduleBtn = document.getElementById('addScheduleBtn');
  if (addScheduleBtn) {
    addScheduleBtn.addEventListener('click', () => {
      const scheduleContainer = document.getElementById('scheduleContainer');
      const newSchedule = document.createElement('div');
      newSchedule.className = 'schedule-item mb-3 p-3';
      newSchedule.style.cssText = 'background:#f9f7f0; border-radius:6px;';
      newSchedule.innerHTML = `
        <div class="row mb-2">
          <div class="col-md-4">
            <label class="form-label">Ngày thứ</label>
            <input type="number" class="form-control schedule-day" placeholder="1" min="1">
          </div>
          <div class="col-md-6">
            <label class="form-label">Hoạt động</label>
            <input type="text" class="form-control schedule-activity" placeholder="VD: Đà Nẵng – Ngũ Hành Sơn – Hội An">
</div>
          <div class="col-md-2">
            <label class="form-label">Bản đồ</label>
            <button type="button" class="btn btn-sm btn-primary w-100 btnMapLocation" data-bs-toggle="modal" data-bs-target="#mapModal">📍 Chọn</button>
          </div>
        </div>
      `;
      scheduleContainer.appendChild(newSchedule);

      const newBtn = newSchedule.querySelector('.btnMapLocation');
      if (newBtn) {
        newBtn.addEventListener('click', (e) => {
          currentScheduleItem = e.target.closest('.schedule-item');
          if (!map) {
            setTimeout(initMap, 300);
          }
          selectedLocationName = '';
          const sel = document.getElementById('selectedLocation');
          if (sel) sel.textContent = 'Chưa chọn';
        });
      }
    });
  }

  // ========== NÚT CHỌN BẢN ĐỒ (sửa) =========
  const mapButtons = document.querySelectorAll('.btnMapLocation');
  mapButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // dùng e.currentTarget để chắc chắn lấy đúng nút (không phụ thuộc vào target con)
      currentScheduleItem = e.currentTarget.closest('.schedule-item');
      console.log("Selected schedule item:", currentScheduleItem);
      if (!map) {
        setTimeout(initMap, 300);
      }
      // set ngay giá trị tạm (tọa độ sẽ hiển thị nếu reverse geocode chậm)
      selectedLocationName = '';
      const sel = document.getElementById('selectedLocation');
      if (sel) sel.textContent = 'Chưa chọn';
    });
  });

  // ========== NÚT XÁC NHẬN BẢN ĐỒ (cho phép fallback từ marker) =========
  const confirmMapBtn = document.getElementById('confirmMapBtn');
  if (confirmMapBtn) {
    confirmMapBtn.addEventListener('click', () => {
      console.log("Confirm clicked - selectedLocationName:", selectedLocationName);
      console.log("Confirm clicked - currentScheduleItem:", currentScheduleItem);

      // nếu chưa có name nhưng có marker, dùng toạ độ marker làm fallback
      if ((!selectedLocationName || !selectedLocationName.trim()) && marker) {
        const latlng = marker.getLatLng();
        selectedLocationName = `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
      }

      if (selectedLocationName && selectedLocationName.trim() && currentScheduleItem) {
        currentScheduleItem.dataset.location = selectedLocationName;
        const activityInput = currentScheduleItem.querySelector('.schedule-activity');
        if (activityInput) {
          activityInput.value = selectedLocationName;
          activityInput.style.backgroundColor = '#d4edda';
        }
        const mapModal = bootstrap.Modal.getInstance(document.getElementById('mapModal'));
        if (mapModal) mapModal.hide();
        currentScheduleItem = null;
        selectedLocationName = '';
        const sel = document.getElementById('selectedLocation');
        if (sel) sel.textContent = 'Chưa chọn';

        console.log("Confirm success!");

      } else {
        console.log("Validation failed!");
        alert('Vui lòng chọn một vị trí trên bản đồ');
      }
    });
  }

  // ========== TOGGLE SIDEBAR ==========
  const btnToggle = document.getElementById('btnToggle');
  const sidebar = document.getElementById('sidebar');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
});
