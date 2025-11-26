moment.locale('vi');
const API_BASE_URL = 'http://localhost:3000';

let allTours = [];
let allDepartures = [];
let allBookings = [];
let allGuides = [];
// Đã loại bỏ allNotes

async function fetchData(endpoint) {
    try {
        const response = await window.fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            throw new Error(`lỗi khi tải dữ liệu từ ${endpoint}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        // Cập nhật colspan về 8 cột
        document.getElementById('customerList').innerHTML = '<tr><td colspan="8" class="text-center text-danger p-4">Không thể kết nối đến API. Hãy đảm bảo JSON Server đang chạy.</td></tr>';
        return [];
    }
}

async function initPage() {
    // Đã loại bỏ fetchData('notes')
    [allTours, allDepartures, allBookings, allGuides] = await Promise.all([
        fetchData('tours'),
        fetchData('departures'),
        fetchData('bookings'),
        fetchData('staffs'),
    ]);

    populateTourFilter(); 

    // CHỈ GẮN LISTENER CHO TOUR FILTER
    const tourFilterElement = document.getElementById('tourFilter');
    if (tourFilterElement) {
        tourFilterElement.addEventListener('change', resetListState);
    }
    
    resetListState(); // Thiết lập trạng thái ban đầu khi tải trang
}

function resetListState() {
    document.getElementById('tripInfo').style.display = "none";
    document.getElementById('listTitle').textContent = 'Thông tin các lượt đặt chỗ';
    // Cập nhật colspan về 8 cột
    document.getElementById('customerList').innerHTML = '<tr><td colspan="8" class="text-center text-muted p-4">Vui lòng chọn Tour, sau đó nhấn "Xem Khách".</td></tr>';
}


function getTourInfo(tourID) {
    return allTours.find(t => String(t.id) === String(tourID));
}

function getStaffInfo(staffID) {
    return allGuides.find(s => String(s.id) === String(staffID));
}

function getStatusBadge(status) {
    let className = 'text-bg-secondary';
    if (status === 'Đã cọc') className = 'text-bg-warning';
    if (status === 'Hoàn thành') className = 'text-bg-success';
    return `<span class="badge ${className}">${status || 'Mới'}</span>`;
}

function populateTourFilter() {
    const selectTour = document.getElementById('tourFilter'); 
    if (!selectTour) return;

    selectTour.innerHTML = '<option value = ""> -- Chọn Tour -- </option>';
    
    const validTours = allTours.filter(t => t.name && t.id).sort((a, b) => a.id - b.id);
    
    validTours.forEach(tour => {
        const option = document.createElement('option');
        option.value = String(tour.id);
        option.textContent = `${tour.name} (Mã: ${tour.tour_code || 'N/A'})`; 
        selectTour.appendChild(option);
    });

    selectTour.disabled = validTours.length === 0;
    selectTour.value = ""; 
}


window.applyFilter = function() {
    const selectedTourId = document.getElementById("tourFilter").value; 
    
    document.getElementById("tripInfo").style.display = "none";
    document.getElementById("listTitle").textContent = ` Thông tin các lượt đặt chỗ`;

    if (!selectedTourId) {
        document.getElementById("customerList").innerHTML = '<tr><td colspan="8" class="text-center text-muted p-4">Vui lòng chọn Tour.</td></tr>';
        return;
    }

    // Lọc bookings: Chỉ cần khớp Tour ID
    let filteredBookings = allBookings.filter(booking => {
        return String(booking.tourId) === selectedTourId;
    });
    
    const tourDetail = getTourInfo(selectedTourId);
    const guideDepartures = allDepartures.filter(dep => String(dep.tourId) === selectedTourId);
    let staffInfoHtml = 'N/A';
    
    if (guideDepartures.length > 0) {
        const uniqueGuideIds = [...new Set(guideDepartures.map(dep => dep.guideId))];
        
        staffInfoHtml = uniqueGuideIds.map(guideId => {
            const staff = getStaffInfo(guideId);
            return staff ? staff.name : `ID ${guideId} (Không tìm thấy)`;
        }).join(', ');
    }
    
    if (tourDetail) {
        document.getElementById('infoTourName').textContent = tourDetail.name;
        document.getElementById('infoTourCode').textContent = tourDetail.tour_code || 'N/A';
        document.getElementById('infoDriver').textContent = staffInfoHtml; 
        document.getElementById('infoMeetingPoint').textContent = 'N/A (Nhiều chuyến)'; 

        document.getElementById('tripInfo').style.display = 'block';
        document.getElementById('listTitle').textContent = `Danh sách ${filteredBookings.length} khách hàng đã đặt Tour ${tourDetail.name}`;
    }

    updateCustomerList(filteredBookings);
}

/**
 * Cập nhật danh sách khách hàng trong bảng.
 */
function updateCustomerList(bookings) {
    const tbody = document.getElementById('customerList');
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        // Cập nhật colspan về 8 cột
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted p-4">Không tìm thấy khách hàng nào đã đặt Tour này theo bộ lọc.</td></tr>';
        return;
    }

    bookings.forEach((booking, index) => {
        const customerName = booking.customerName || (booking.email ? booking.email.split('@')[0] : 'N/A');
        
        const departureDate = booking.departureDate ? moment(booking.departureDate).format('DD/MM/YYYY') : 'N/A';
        const travelType = booking.travelType || booking.type || 'Khách lẻ';

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${customerName}</strong></td>
            <td>${booking.email || 'N/A'}</td>
            <td>${booking.phone || 'N/A'}</td>
            <td>${booking.quantity}</td>
            <td>${departureDate}</td> 
            <td>${travelType}</td>
            <td>${getStatusBadge(booking.status)}</td>
            `;
    })
}

// Đã loại bỏ hàm window.showDetail = function(bookingId) { ... }

document.addEventListener('DOMContentLoaded', initPage);