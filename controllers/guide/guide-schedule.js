moment.locale('vi');
const API_BASE_URL = 'http://localhost:3000'

let allTours = [];
let allGuides = [];
let allDepartures = [];

// Map để tra cứu nhanh thông tin
let tourMap = new Map();
let staffMap = new Map();

// --- HÀM HỖ TRỢ API VÀ DỮ LIỆU ---

async function fetchData(endpoint) {
    try {
        const response = await window.fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            throw new Error(`Lỗi khi tải dữ liệu từ ${endpoint}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        // Hiển thị thông báo lỗi trên bảng lịch trình
        document.getElementById('scheduleList').innerHTML = '<tr><td colspan="8" class="text-center text-danger p-4">Không thể kết nối đến API. Hãy đảm bảo JSON Server đang chạy.</td></tr>';
        return [];
    }
}

function formatDate(dateString) {
    return moment(dateString).format('DD/MM/YYYY');
}

function getTourInfo(tourID) {
    return tourMap.get(String(tourID));
}

function getGuideInfo(guideID) {
    return staffMap.get(String(guideID));
}

// --- HÀM MỚI: XỬ LÝ MODAL HÀNH TRÌNH (Sử dụng tour.schedule) ---

/**
 * Hiển thị Modal chi tiết hành trình của một Tour.
 * @param {string} tourId - ID của Tour.
 */
window.showItineraryModal = (tourId) => {
    const tour = getTourInfo(tourId); 
    
    // Sử dụng trường 'schedule' từ JSON mới
    if (!tour || !tour.schedule || tour.schedule.length === 0) {
        alert("Không tìm thấy thông tin hành trình chi tiết cho Tour này.");
        return;
    }

    const modalTourName = document.getElementById('modalTourName');
    const modalContent = document.getElementById('modalItineraryContent');

    modalTourName.textContent = tour.name;
    modalContent.innerHTML = ''; // Xóa nội dung cũ

    let htmlContent = '<ul class="list-group list-group-flush">';
    
    // Lặp qua tour.schedule
    tour.schedule.forEach(item => {
        // Sử dụng trường 'activity'
        if (item.day && item.activity) {
            htmlContent += `
                <li class="list-group-item">
                    <h6 class="text-primary mb-1">Ngày ${item.day}:</h6>
                    <p class="mb-0">${item.activity}</p>
                </li>
            `;
        }
    });

    htmlContent += '</ul>';
    modalContent.innerHTML = htmlContent;

    // Hiển thị modal (sử dụng Bootstrap JS)
    // Lưu ý: Đảm bảo Bootstrap JS Bundle đã được nhúng
    const itineraryModal = new bootstrap.Modal(document.getElementById('itineraryModal'));
    itineraryModal.show();
};


// --- HÀM KHỞI TẠO BỘ LỌC VÀ LỌC DỮ LIỆU (Giữ nguyên) ---

function initializeFilters() {
    const tourFilter = document.getElementById('tourFilter');
    const guideFilter = document.getElementById('guideFilter');

    tourFilter.innerHTML = '<option value="">Tất cả Tour</option>';
    guideFilter.innerHTML = '<option value="">Tất cả HDV</option>';

    allTours.forEach(tour => {
        const option = document.createElement('option');
        option.value = String(tour.id);
        option.textContent = `${tour.name} (${tour.tour_code || 'N/A'})`;
        tourFilter.appendChild(option);
    });

    allGuides.forEach(staff => {
        const option = document.createElement('option');
        option.value = String(staff.id);
        option.textContent = staff.name;
        guideFilter.appendChild(option);
    });

    const now = moment().format('YYYY-MM');
    document.getElementById('monthFilter').value = now;
}

window.applyFilter = () => {
    const monthFilterValue = document.getElementById('monthFilter').value;
    const tourFilterValue = document.getElementById('tourFilter').value;
    const guideFilterValue = document.getElementById('guideFilter').value;

    const targetMonth = monthFilterValue ? moment(monthFilterValue, 'YYYY-MM') : moment();

    if (allDepartures.length === 0) {
        renderScheduleList([]);
        return;
    }

    const filteredDepartures = allDepartures.filter(departure => {
        const departureDate = moment(departure.dateStart);

        const isSameMonth = departureDate.year() === targetMonth.year() &&
                            departureDate.month() === targetMonth.month();
        if (!isSameMonth) return false;

        if (tourFilterValue && String(departure.tourId) !== tourFilterValue) {
            return false;
        }

        if (guideFilterValue && String(departure.guideId) !== guideFilterValue) {
            return false;
        }

        return true;
    });

    renderScheduleList(filteredDepartures);
};


// --- HÀM HIỂN THỊ DANH SÁCH (ĐÃ CẬP NHẬT) ---

function renderScheduleList(departures) {
    const tbody = document.getElementById('scheduleList');
    tbody.innerHTML = ''; 

    if (departures.length === 0 && allDepartures.length > 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted p-4">
                    <i class="bi bi-info-circle me-2"></i>Không tìm thấy lịch khởi hành nào phù hợp với điều kiện lọc.
                </td>
            </tr>
        `;
        return;
    } else if (allDepartures.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted p-4">Đang tải dữ liệu lịch trình...</td></tr>';
        return;
    }

    departures.forEach((departure, index) => {
        const tour = getTourInfo(departure.tourId);
        const guide = getGuideInfo(departure.guideId);

        const tourName = tour ? tour.name : 'Không rõ Tour';
        const tourCode = tour ? tour.tour_code : 'N/A';
        const guideName = guide ? guide.name : '<span class="text-danger fw-bold">Chưa phân công</span>';
        const driverName = departure.driver || '<span class="text-warning">Chưa rõ</span>';
        
        // Kiểm tra xem Tour có dữ liệu schedule hay không
        const hasSchedule = tour && tour.schedule && tour.schedule.length > 0;

        const row = document.createElement('tr');
        
        // ✨ THAY ĐỔI 1: Thiết lập con trỏ và thêm Event Listener
        if (hasSchedule) {
            row.style.cursor = 'pointer'; // Hiển thị con trỏ là kiểu 'pointer' khi rê chuột
            // Gọi hàm showItineraryModal khi click vào bất kỳ đâu trên hàng
            row.addEventListener('click', () => {
                window.showItineraryModal(tour.id);
            });
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="fw-bold">
                ${tourName}
                ${!hasSchedule ? 
                    '<br><span class="text-muted fst-italic"><i class="bi bi-slash-circle me-1"></i>Chưa có H/T</span>'
                    : ''
                }
            </td>
            <td>${tourCode}</td>
            <td>${formatDate(departure.dateStart)}</td>
            <td>${formatDate(departure.dateEnd)}</td>
            <td class="text-primary">${guideName}</td>
            <td>${driverName}</td>
            <td>${departure.meetingPoint || 'N/A'}</td>
        `;
        
        // Nếu hàng không có schedule, chúng ta không muốn người dùng click vào
        if (hasSchedule) {
             row.classList.add('table-primary-hover'); // Tùy chọn: Thêm class hover trực quan hơn
        }
        
        tbody.appendChild(row);
    });
}


// --- HÀM KHỞI TẠO TRANG (Giữ nguyên) ---

async function initPage() {
    [allTours, allDepartures, allGuides] = await Promise.all([
        fetchData('tours'),
        fetchData('departures'),
        fetchData('staffs'),
    ]);

    tourMap = new Map(allTours.map(t => [String(t.id), t]));
    staffMap = new Map(allGuides.map(s => [String(s.id), s]));

    initializeFilters();
    applyFilter(); 

    document.getElementById('monthFilter').addEventListener('change', window.applyFilter);
    document.getElementById('tourFilter').addEventListener('change', window.applyFilter);
    document.getElementById('guideFilter').addEventListener('change', window.applyFilter);
}

document.addEventListener('DOMContentLoaded', initPage);