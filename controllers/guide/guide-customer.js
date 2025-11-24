// Khai báo URL API
moment.locale('vi')
const API_BASE_URL = 'http://localhost:3000'

// Biến lưu trữ dữ liệu
let allTours = [];
let allGuides = [];
let allDepartures = [];
let allBookings = [];

// 1. Tải dữ liệu và khởi tạo

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
    //tải tất cả các dữ liệu
    [allTours, allGuides, allDepartures, allBookings] = await Promise.all([
        fetchData('tours'),
        fetchData('staffs'),
        fetchData('departures'),
        fetchData('bookings'),
    ]);

    //Lọc hướng dẫn viên nội địa hoặc quốc tế

    allGuides = allGuides.filter(staff => staff.type === 'noi_dia' || staff.type === 'quoc_te');

    if (allGuides.length > 0) {
        populateGuideFilter();
    }
    document.getElementById('guideFilter').addEventListener('change', populateDepartureFilter);
    document.getElementById('guideFilter').addEventListener('change', applyFilter);
    document.getElementById('departureFilter').addEventListener('change', applyFilter);
}

// Điền dữ liệu lọc HDV

function populateGuideFilter() {
    const select = document.getElementById('guideFilter');

    allGuides.forEach(guide => {
        const option = document.createElement('option');
        // hiển thị tên và id HDV
        option.value = String(guide.id); // đảm bảo value là chuỗi
        option.textContent = guide.name
        select.appendChild(option);
    });
}

//2 Xử lý lọc HDV

function getTourInfo(tourID) {
    // chuyển id tour sang kiểu số để so sánh
    return allTours.find(t => String(t.id) === String(tourID));
}

function populateDepartureFilter() {
    const guideId = document.getElementById('guideFilter').value;
    const selectDeparture = document.getElementById('departureFilter');

    selectDeparture.innerHTML = '<option value = ""> -- Chọn Tour / Ngày </option>';

    if (!guideId) {
        selectDeparture.disabled = true;
        document.getElementById('tripInfo').style.display = "none";
        return;
    }

    // Lọc các khởi hành có HDV được chọn

    const filteredDepartures = allDepartures.filter(dep => String(dep.guideId) === guideId).sort((a, b) => moment(a.dateStart) - moment(b.dateStart)) // sắp xếp theo ngày
    filteredDepartures.forEach(dep => {
        const tour = getTourInfo(dep.tourId);
        const dateSt = moment(dep.dateStart).format("DD/MM/YYYY");

        const option = document.createElement('option');

        option.value = `${dep.tourId}_${dep.dateStart}`;
        option.textContent = `${dateSt}-${tour ? tour.name : 'tour không tồn tại'}`

        selectDeparture.appendChild(option);
    });

    selectDeparture.disabled = filteredDepartures.length === 0;
}


// 3 Xử lý hiện thị thông tin chuyến đi và khách hàng 

function applyFilter() {
    const selectedDepartureValue = document.getElementById("departureFilter").value;

    document.getElementById("tripInfo").style.display = "none";

    document.getElementById("listTitle").textContent = ` Khách hàng của chuyến đi `;

    if (!selectedDepartureValue) {
        document.getElementById("customerList").innerHTML = '<tr><td colspan="7" class="text-center text-muted p-4">Vui lòng chọn Tour và Ngày khởi hành.</td></tr>';
        return;
    }

    // tách tourId và dateStart từ giá trị đã chọn
    const [tourId, dateStart] = selectedDepartureValue.split('_');

    //1Lọc Booking theo tourId và dateStart
    let filteredBookings = allBookings.filter(booking => {
        return String(booking.tourId) === tourId && booking.departureDate === dateStart;
    });

    //2 lấy thong tin tour 
    const departureDetail = allDepartures.find(dep => String(dep.tourId) === tourId && dep.dateStart === dateStart);

    const tourDetail = getTourInfo(tourId);

    //3 cập nhật thông tin dashboard 
    if (departureDetail && tourDetail) {
        document.getElementById('infoTourName').textContent = tourDetail.name;
        document.getElementById('infoTourCode').textContent = tourDetail.tour_code || 'N/A';
        document.getElementById('infoDriver').textContent = departureDetail.driver || 'Chưa phân công';
        document.getElementById('infoMeetingPoint').textContent = departureDetail.meetingPoint || 'N/A';
        document.getElementById('tripInfo').style.display = 'block';
        document.getElementById('listTitle').textContent = `Danh sách ${filteredBookings.length} khách hàng cho chuyến ${tourDetail.name} khởi hành ngày ${moment(dateStart).format('DD/MM/YYYY')}`;
    }

    //4 cập nhât danh sách khách hàng
    updateCustomerList(filteredBookings);
}

function updateCustomerList(bookings) {
    const tbody = document.getElementById('customerList');
    tbody.innerHTML = '';

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted p-4">Không tìm thấy khách hàng nào cho chuyến đi này.</td></tr>';
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

//chạy hàm khởi tạo khi DOM tải xong

document.addEventListener('DOMContentLoaded', initPage)