let guidesData = []; // lưu dữ liệu gốc

const getGuides = async () => {
  try {
    const res = await fetch('http://localhost:3000/staffs');
    const data = await res.json();
    guidesData = data;
    renderGuides(data);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu HDV:", error);
  }
}

const renderGuides = (list) => {
  const tbody = document.getElementById('guideTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#999;">Không có HDV nào</td></tr>`;
    return;
  }

  const trLists = list.map((g, index) => {
    const languages = g.languages?.join(', ') || '';
    const avatarUrl = g.avatar || '/assets/placeholder.jpg';
    const typeName = g.type === 'quoc_te' ? 'Quốc tế' : 'Nội địa';

    return `
      <tr>
        <th scope="row">${index + 1}</th>
        <td>${g.name}</td>
        <td>${g.sex}</td>
        <td>${g.email}</td>
        <td style="text-align: center;">
            <img src="${avatarUrl}" alt="${g.name}" width="60" height="60" style="border-radius:50%;">
        </td>
        <td>${g.phone}</td>
        <td>${typeName}</td>
        <td>${languages}</td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = trLists;
}

// Lọc theo 2 select
const applyFilters = () => {
  const sexFilter = document.getElementById('filterSex').value;
  const typeFilter = document.getElementById('filterType').value;

  let filtered = [...guidesData];

  if (sexFilter) {
    filtered = filtered.filter(g => g.sex === sexFilter);
  }

  if (typeFilter) {
    filtered = filtered.filter(g => (g.type === 'quoc_te' ? 'Quốc tế' : 'Nội địa') === typeFilter);
  }

  renderGuides(filtered);
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
  getGuides();

  document.getElementById('filterSex').addEventListener('change', applyFilters);
  document.getElementById('filterType').addEventListener('change', applyFilters);
});
