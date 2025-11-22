// controllers/admin/special-notes.js
// Fetch notes from json-server and render with search + filter support

const API = 'http://localhost:3000/notes';

function clearRender() {
  const mainPanel = document.querySelector('.main');
  if (!mainPanel) return;
  // remove previously appended notes container(s)
  const existing = mainPanel.querySelectorAll('.notes-container');
  existing.forEach(n => n.remove());
}

function renderNotes(data) {
  const container = document.createElement('div');
  container.className = 'notes-container';

  if (!Array.isArray(data) || data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'card-panel';
    empty.innerHTML = '<p style="color:#666">Không có ghi chú đặc biệt.</p>';
    container.appendChild(empty);
    const main = document.querySelector('.main');
    if (main) main.appendChild(container);
    return;
  }

  data.forEach(item => {
    const box = document.createElement('div');
    box.className = 'card-panel';
    box.style.marginTop = '12px';

    const typeLabels = {
      customer: 'Khách hàng',
      meal: 'Ăn uống',
      hotel: 'Khách sạn',
      transport: 'Vận chuyển',
      health: 'Sức khoẻ',
      payment: 'Thanh toán',
      other: 'Khác'
    };

    const badgeLabel = typeLabels[item.note_type] || item.note_type || 'Khác';

    box.innerHTML = `
      <h4 style="margin-bottom:6px">${item.tour_name || '-'} 
        <small style="color:#5c440f;background:#f1e6cf;padding:4px 8px;border-radius:6px;font-size:12px">${badgeLabel}</small>
      </h4>
      <p><strong>Khách:</strong> ${item.customer_name || '-'} <span style="float:right"><strong>Ngày:</strong> ${item.start_date || '-'}</span></p>
      <p><strong>SĐT:</strong> ${item.phone || '-'}</p>
      <p><strong>Ghi chú:</strong> <span style="color:#8b5e00">${item.special_notes || 'Không có'}</span></p>
    `;

    container.appendChild(box);
  });

  // append to the main content area (after grid panels)
  const main = document.querySelector('.main');
  if (main) main.appendChild(container);
}

function setupSearch(data) {
  const searchInput = document.getElementById('searchSpecial');
  if (!searchInput) return;
  searchInput.addEventListener('input', e => {
    const keyword = e.target.value.trim().toLowerCase();
    const filtered = data.filter(n =>
      (n.customer_name || '').toLowerCase().includes(keyword) ||
      (n.tour_name || '').toLowerCase().includes(keyword) ||
      (n.special_notes || '').toLowerCase().includes(keyword)
    );
    clearRender();
    renderNotes(filtered);
  });
}

function setupFilter(data) {
  const filter = document.getElementById('filterType');
  if (!filter) return;
  filter.addEventListener('change', () => {
    const type = filter.value;
    const filtered = type ? data.filter(d => d.note_type === type) : data;
    clearRender();
    renderNotes(filtered);
  });
}

// init
(async function init() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    // render initial
    clearRender();
    renderNotes(data);

    // setup search & filter
    setupSearch(data);
    setupFilter(data);
  } catch (err) {
    console.error('Lỗi khi load notes:', err);
    // show short feedback in page
    const main = document.querySelector('.main');
    if (main) {
      const errBox = document.createElement('div');
      errBox.className = 'card-panel';
      errBox.innerHTML = '<p style="color:red">Không thể tải ghi chú. Kiểm tra json-server đang chạy?</p>';
      main.appendChild(errBox);
    }
  }
})();