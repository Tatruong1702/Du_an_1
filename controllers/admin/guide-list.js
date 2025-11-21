let guidesData = []; // lưu dữ liệu gốc
let editingId = null; // lưu id khi đang sửa

const getGuides = async () => {
  try {
    const res = await fetch('http://localhost:3000/staffs');
    const data = await res.json();
    guidesData = data;

    // Cập nhật số lượng HDV
    const totalEl = document.getElementById('total-guides');
    if (totalEl) totalEl.textContent = `Số HDV hiện có: ${data.length}`;

    renderGuides(data);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu HDV:", error);
    alert("Không thể tải danh sách hướng dẫn viên!");
  }
}

const renderGuides = (list) => {
  const tbody = document.getElementById('guideTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#999;">Không có HDV nào</td></tr>`;
    return;
  }

  const trLists = list.map((g, index) => {
    const languages = g.languages?.join(', ') || '';
    const avatarUrl = g.avatar || '/assets/placeholder.jpg';
    const typeName = g.type === 'quoc_te' ? 'Quốc tế' : 'Nội địa';

    return `
      <tr>
        <th scope="row">${index + 1}</th>
        <td><strong>${g.name}</strong></td>
        <td>${g.sex}</td>
        <td>${g.email}</td>
        <td style="text-align: center;">
            <img src="${avatarUrl}" alt="${g.name}" width="60" height="60" style="border-radius:50%;">
        </td>
        <td>${g.phone || '—'}</td>
        <td>
          <span class="badge ${g.type === 'quoc_te' ? 'bg-primary' : 'bg-success'}">
            ${typeName}
          </span>
        </td>
        <td>${languages}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="openEditModal('${g.id}')" title="Sửa">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteGuide('${g.id}', '${g.name}')" title="Xóa">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = trLists;
}

// ========== MODAL SỬA ==========
window.openEditModal = (id) => {
  const guide = guidesData.find(g => g.id === id);
  if (!guide) return;

  editingId = id;

  document.getElementById('guideName').value = guide.name;
  document.getElementById('guideSex').value = guide.sex;
  document.getElementById('guideEmail').value = guide.email;
  document.getElementById('guidePhone').value = guide.phone || '';
  document.getElementById('guideAvatar').value = guide.avatar || '';
  document.getElementById('guideType').value = guide.type || 'noi_dia';
  document.getElementById('guideLanguages').value = guide.languages?.join(', ') || '';

  document.getElementById('guideModalTitle').textContent = 'Sửa hướng dẫn viên';
  new bootstrap.Modal(document.getElementById('guideModal')).show();
}

// ========== XÓA HDV ==========
window.deleteGuide = async (id, name) => {
  if (confirm(`Bạn có chắc chắn muốn xóa hướng dẫn viên: ${name}?`)) {
    try {
      await fetch(`http://localhost:3000/staffs/${id}`, { method: 'DELETE' });
      alert("Xóa thành công!");
      getGuides(); // reload danh sách
    } catch (error) {
      alert("Lỗi khi xóa!");
    }
  }
}

// ========== LỌC THEO 2 SELECT==========
const applyFilters = () => {
  const sexFilter = document.getElementById('filterSex').value;
  const typeFilter = document.getElementById('filterType').value;

  let filtered = [...guidesData];

  if (sexFilter) {
    filtered = filtered.filter(g => g.sex === sexFilter);
  }

  if (typeFilter) {
    const typeKey = typeFilter === 'noi_dia' ? 'noi_dia' : 'quoc_te';
    filtered = filtered.filter(g => g.type === typeKey);
  }

  renderGuides(filtered);
}

// ========== THÊM VÀ SỬA) ==========
document.getElementById('saveGuideBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('guideName').value.trim();
  const email = document.getElementById('guideEmail').value.trim();

  if (!name || !email || !email.includes('@')) {
    alert("Vui lòng nhập đầy đủ và đúng họ tên + email!");
    return;
  }

  const data = {
    name,
    sex: document.getElementById('guideSex').value,
    email,
    phone: document.getElementById('guidePhone').value.trim(),
    avatar: document.getElementById('guideAvatar').value.trim() || null,
    type: document.getElementById('guideType').value,
    languages: document.getElementById('guideLanguages').value
      .split(',')
      .map(l => l.trim())
      .filter(l => l)
  };

  try {
    if (editingId) {
      // SỬA
      await fetch(`http://localhost:3000/staffs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      alert("Cập nhật thành công!");
    } else {
      // THÊM MỚI
      await fetch('http://localhost:3000/staffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      alert("Thêm hướng dẫn viên thành công!");
    }

    bootstrap.Modal.getInstance(document.getElementById('guideModal')).hide();
    editingId = null;
    getGuides(); // reload lại danh sách
  } catch (error) {
    console.error(error);
    alert("Lỗi khi lưu dữ liệu!");
  }
});

// ========== RESET FORM KHI BẤM "THÊM MỚI" ==========
document.querySelector('[data-bs-target="#guideModal"]')?.addEventListener('click', () => {
  editingId = null;
  document.getElementById('guideModalTitle').textContent = 'Thêm hướng dẫn viên mới';
  document.getElementById('guideForm')?.reset();
});


document.addEventListener('DOMContentLoaded', () => {
  getGuides();

  document.getElementById('filterSex').addEventListener('change', applyFilters);
  document.getElementById('filterType').addEventListener('change', applyFilters);
});