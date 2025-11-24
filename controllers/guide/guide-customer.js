moment.locale('vi')
const API_BASE_URL = 'http://localhost:3000'

let allTours = [];
let allDepartures = [];
let allBookings = [];
let allGuides = [];

async function fetchData(endpoint) {
    try {
        const response = await window.fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            throw new Error(`lỗi khi tải dữ liệu từ ${endpoint}:${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        document.getElementById('customerList').innerHTML = '<tr><td colspan="7" class="text-center text-danger p-4">Không thể kết nối đến API. Hãy đảm bảo JSON Server đang chạy.</td></tr>';
        return [];
    }
}

async function initPage() {
    [allTours, allDepartures, allBookings, allGuides] = await Promise.all([
        fetchData('tours'),
        fetchData('departures'),
        fetchData('bookings'),
        fetchData('staffs'),
    ]);

    populateTourFilter(); 

    document.getElementById('tourFilter').addEventListener('change', () => { 
        document.getElementById('tripInfo').style.display = "none";
        document.getElementById('customerList').innerHTML = '<tr><td colspan="7" class="text-center text-muted p-4">Vui lòng nhấn "Xem Khách" để lấy danh sách.</td></tr>';
    });
}

function getTourInfo(tourID) {
    return allTours.find(t => String(t.id) === String(tourID));
}

function getStaffInfo(staffID) {
    return allGuides.find(s => String(s.id) === String(staffID));
}

function populateTourFilter() {
    const selectTour = document.getElementById('tourFilter'); 

    selectTour.innerHTML = '<option value = ""> -- Chọn Tour -- </option>';
    document.getElementById('tripInfo').style.display = "none";

    const validTours = allTours.filter(t => t.name && t.id).sort((a, b) => a.id - b.id);
    
    validTours.forEach(tour => {
        const option = document.createElement('option');

        option.value = String(tour.id);
        option.textContent = `${tour.name} (Mã: ${tour.tour_code || 'N/A'})`; 

        selectTour.appendChild(option);
    });

    selectTour.disabled = validTours.length === 0;
    selectTour.value = ""; 
    
    document.getElementById('customerList').innerHTML = '<tr><td colspan="7" class="text-center text-muted p-4">Vui lòng chọn Tour, sau đó nhấn "Xem Khách".</td></tr>';
}

function applyFilter() {
    const selectedTourId = document.getElementById("tourFilter").value; 

    document.getElementById("tripInfo").style.display = "none";
    document.getElementById("listTitle").textContent = ` Khách hàng của chuyến đi `;

    if (!selectedTourId) {
        document.getElementById("customerList").innerHTML = '<tr><td colspan="7" class="text-center text-muted p-4">Vui lòng chọn Tour.</td></tr>';
        return;
    }

    let filteredBookings = allBookings.filter(booking => {
        return String(booking.tourId) === selectedTourId; 
    });
    const tourDetail = getTourInfo(selectedTourId);
    
    const guideDepartures = allDepartures.filter(dep => String(dep.tourId) === selectedTourId);
    
    let staffInfoHtml = 'N/A';
    
    if (guideDepartures.length > 0) {
        // Lấy danh sách guideId duy nhất
        const uniqueGuideIds = [...new Set(guideDepartures.map(dep => dep.guideId))];
        
        staffInfoHtml = uniqueGuideIds.map(guideId => {
            const staff = getStaffInfo(guideId);
            return staff ? staff.name : `ID ${guideId} (Không tìm thấy)`;
        }).join(', ');
    }
    
    if (tourDetail) {
        document.getElementById('infoTourName').textContent = tourDetail.name;
        document.getElementById('infoTourCode').textContent = tourDetail.tour_code || 'N/A';
        
        // Hiển thị HDV (sử dụng lại ID 'infoDriver')
        document.getElementById('infoDriver').textContent = staffInfoHtml; 
        
        // Gán giá trị rỗng cho infoMeetingPoint
        document.getElementById('infoMeetingPoint').textContent = ''; 

        document.getElementById('tripInfo').style.display = 'block';
        document.getElementById('listTitle').textContent = `Danh sách ${filteredBookings.length} khách hàng đã đặt Tour ${tourDetail.name}`;
    }

    updateCustomerList(filteredBookings);
}

function updateCustomerList(bookings) {
    const tbody = document.getElementById('customerList');
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-4">Không tìm thấy khách hàng nào đã đặt Tour này.</td></tr>';
        return;
    }

    bookings.forEach((booking, index) => {
        const customerName = booking.customerName || (booking.email ? booking.email.split('@')[0] : booking.phone);

        let statusBadge = '';
        if (booking.status === "Hoàn thành") {
            statusBadge = `<span class="badge text-bg-success">${booking.status}</span>`;
        } else if (booking.status === 'Đã cọc') {
            statusBadge = `<span class="badge text-bg-warning">${booking.status}</span>`;
        } else {
            statusBadge = `<span class="badge text-bg-secondary">${booking.status || 'Mới'}</span>`;
        }

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${customerName}</strong></td>
            <td>${booking.email || 'N/A'}</td>
            <td>${booking.phone || 'N/A'}</td>
            <td>${booking.quantity}</td>
            <td>${booking.travelType || booking.type || 'Khách lẻ'}</td>
            <td>${statusBadge}</td>
        `;
    })
}

document.addEventListener('DOMContentLoaded', initPage)