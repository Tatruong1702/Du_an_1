// guide-log.js
const API_BASE = 'http://localhost:3000';

// Lấy thông tin guide hiện tại
const getCurrentGuide = () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return null;
  return user;
};

// Lấy ID guide từ staffs
const getGuideId = async () => {
  try {
    const guide = getCurrentGuide();
    if (!guide) return null;

    const staffsRes = await fetch(`${API_BASE}/staffs`);
    const staffs = await staffsRes.json();
    
    const currentStaff = staffs.find(s => 
      s.email === guide.email || s.name === guide.username
    );

    return currentStaff ? currentStaff.id : null;
  } catch (error) {
    console.error('Lỗi khi lấy guide ID:', error);
    return null;
  }
};

// Lấy danh sách departures của guide hiện tại
const getGuideDepartures = async () => {
  try {
    const guideId = await getGuideId();
    if (!guideId) return [];

    const res = await fetch(`${API_BASE}/departures`);
    const departures = await res.json();

    return departures.filter(dep => String(dep.guideId) === String(guideId));
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

// Render danh sách departures vào select
const renderDepartureSelect = async (selectId, includeAll = false) => {
  const departures = await getGuideDepartures();
  const select = document.getElementById(selectId);

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

  select.innerHTML = includeAll ? '<option value="">-- Tất cả --</option>' : '<option value="">-- Chọn chuyến khởi hành --</option>';
  departuresWithTour.forEach(dep => {
    const option = document.createElement('option');
    option.value = dep.id;
    option.textContent = `${dep.tourName} - ${dep.dateStart} đến ${dep.dateEnd}`;
    select.appendChild(option);
  });
};

// Lấy tất cả logs của guide
const getAllLogs = async () => {
  try {
    const guideId = await getGuideId();
    if (!guideId) return [];

    const res = await fetch(`${API_BASE}/guidesLogs`);
    const allLogs = await res.json();

    return allLogs.filter(log => String(log.guideId) === String(guideId));
  } catch (error) {
    console.error('Lỗi khi lấy logs:', error);
    return [];
  }
};

// Render danh sách logs
const renderLogs = async (filterDepartureId = null) => {
  const container = document.getElementById('logsContainer');
  container.innerHTML = '<p class="text-muted">Đang tải...</p>';

  try {
    let logs = await getAllLogs();

    // Lọc theo departure nếu có
    if (filterDepartureId) {
      const depRes = await fetch(`${API_BASE}/departures/${filterDepartureId}`);
      const departure = await depRes.json();
      logs = logs.filter(log => String(log.tourId) === String(departure.tourId));
    }

    if (logs.length === 0) {
      container.innerHTML = '<p class="text-muted">Chưa có nhật ký nào</p>';
      return;
    }

    // Lấy thông tin tour và departure cho mỗi log
    const logsWithInfo = await Promise.all(
      logs.map(async (log) => {
        const tour = await getTourInfo(log.tourId);
        const depRes = await fetch(`${API_BASE}/departures?tourId=${log.tourId}`);
        const departures = await depRes.json();
        const departure = departures.find(d => String(d.guideId) === String(log.guideId));
        
        return {
          ...log,
          tourName: tour?.name || 'Tour không xác định',
          departureDate: departure?.dateStart || '-'
        };
      })
    );

    // Sắp xếp theo ngày (mới nhất trước)
    logsWithInfo.sort((a, b) => {
      if (a.day !== b.day) return b.day - a.day;
      return 0;
    });

    // Render
    const logsHTML = logsWithInfo.map((log, index) => `
      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="card-title mb-1">${log.tourName}</h6>
              <small class="text-muted">Ngày thứ ${log.day} | Khởi hành: ${log.departureDate}</small>
            </div>
            <span class="badge bg-primary">Log #${index + 1}</span>
          </div>
          <p class="card-text">${log.content || 'Không có nội dung'}</p>
          ${log.images && log.images.length > 0 ? `
            <div class="mt-2">
              ${log.images.map(img => `
                <img src="${img}" alt="Log image" class="img-thumbnail me-2 mb-2" style="max-width: 150px; max-height: 150px;">
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = logsHTML;
  } catch (error) {
    console.error('Lỗi khi render logs:', error);
    container.innerHTML = '<p class="text-danger">Lỗi khi tải nhật ký</p>';
  }
};

// API: Thêm nhật ký mới
const addLog = async (departureId, day, time, note, images = []) => {
  try {
    const guideId = await getGuideId();
    if (!guideId) {
      alert('Không tìm thấy thông tin hướng dẫn viên!');
      return false;
    }

    // Lấy thông tin departure
    const depRes = await fetch(`${API_BASE}/departures/${departureId}`);
    const departure = await depRes.json();

    if (!departure) {
      alert('Không tìm thấy chuyến khởi hành!');
      return false;
    }

    // Tạo log mới
    const newLog = {
      guideId: guideId,
      tourId: departure.tourId,
      day: parseInt(day),
      content: `${time} - ${note}`,
      images: images.filter(img => img.trim())
    };

    // Lấy danh sách logs hiện có để tạo ID mới
    const logsRes = await fetch(`${API_BASE}/guidesLogs`);
    const allLogs = await logsRes.json();
    const numericIds = allLogs
      .map(l => Number(l.id))
      .filter(n => Number.isInteger(n) && n > 0);
    const maxId = numericIds.length ? Math.max(...numericIds) : 0;
    newLog.id = String(maxId + 1);

    // Gửi request tạo log
    const res = await fetch(`${API_BASE}/guidesLogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newLog)
    });

    if (res.ok) {
      alert('Thêm nhật ký thành công!');
      return true;
    } else {
      alert('Lỗi khi thêm nhật ký!');
      return false;
    }
  } catch (error) {
    console.error('Lỗi khi thêm log:', error);
    alert('Lỗi khi thêm nhật ký!');
    return false;
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

  // Render departures cho form và filter
  await renderDepartureSelect('departureSelect', false);
  await renderDepartureSelect('filterDeparture', true);

  // Render logs ban đầu
  await renderLogs();

  // Event listener cho form
  document.getElementById('logForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const departureId = document.getElementById('departureSelect').value;
    const day = document.getElementById('logDay').value;
    const time = document.getElementById('logTime').value;
    const note = document.getElementById('logNote').value;
    const imagesInput = document.getElementById('logImages').value;
    const images = imagesInput ? imagesInput.split(',').map(img => img.trim()) : [];

    if (!departureId || !day || !time || !note) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const success = await addLog(departureId, day, time, note, images);
    
    if (success) {
      // Reset form
      document.getElementById('logForm').reset();
      // Reload logs
      await renderLogs();
    }
  });

  // Event listener cho filter
  document.getElementById('filterDeparture').addEventListener('change', async (e) => {
    const departureId = e.target.value;
    await renderLogs(departureId || null);
  });

  // Toggle sidebar
  const btnToggle = document.getElementById('btnToggle');
  const sidebar = document.getElementById('sidebar');
  if (btnToggle) {
    btnToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
});

