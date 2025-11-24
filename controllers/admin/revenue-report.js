// Thiết lập ngôn ngữ và API endpoint
moment.locale('vi');
const API_BASE_URL = 'http://localhost:3000'; // Thay thế bằng địa chỉ JSON Server/API thực tế của bạn
let allTours = [];
let revenueChartInstance = null;

// Hàm định dạng tiền tệ Việt Nam Đồng
function formatCurrency(amount) {
    if (typeof amount !== 'number') return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Hàm lấy tên tour dựa trên ID
function getTourName(tourId) {
    const tour = allTours.find(t => t.id === tourId);
    return tour ? tour.name : 'Tour không rõ';
}

// Hàm tính doanh thu dự kiến (sử dụng giá người lớn * số lượng)
function calculateBookingRevenue(tourId, quantity) {
    const tour = allTours.find(t => t.id === tourId);
    if (!tour || !tour.price || !tour.price.adult) return 0;
    // Giả định đơn giản: Doanh thu = Giá người lớn * Số lượng
    return tour.price.adult * quantity;
}

// -----------------------------------------------------------
// I. TẢI DỮ LIỆU BAN ĐẦU
// -----------------------------------------------------------

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            throw new Error(`Lỗi khi tải dữ liệu từ ${endpoint}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        alert('Không thể kết nối đến API. Hãy đảm bảo JSON Server đang chạy.');
        return [];
    }
}

async function initPage() {
    // Tải danh sách Tour và Booking
    const [toursData, bookingsData] = await Promise.all([
        fetchData('tours'),
        fetchData('bookings')
    ]);

    allTours = toursData;

    if (allTours.length > 0) {
        populateTourFilter();
    }
    
    // Lưu dữ liệu booking vào localStorage tạm thời để dùng cho việc lọc 
    // (Trong dự án lớn, bạn nên dùng API để lọc trực tiếp trên Server)
    localStorage.setItem('allBookings', JSON.stringify(bookingsData));

    // Thực hiện lọc lần đầu để hiển thị toàn bộ dữ liệu
    applyFilter();
}

// Hàm điền dữ liệu cho ô chọn Tour
function populateTourFilter() {
    const select = document.getElementById('tourFilter');
    allTours.forEach(tour => {
        const option = document.createElement('option');
        // Sử dụng tour.id làm value (phải là string)
        option.value = String(tour.id); 
        option.textContent = tour.name;
        select.appendChild(option);
    });
}

// -----------------------------------------------------------
// II. HÀM CẬP NHẬT GIAO DIỆN
// -----------------------------------------------------------

// Hàm khởi tạo và vẽ biểu đồ
function renderChart(data) {
    // Tổng hợp doanh thu theo tháng/năm
    const monthlyRevenue = {};
    data.forEach(item => {
        const monthYear = `${item.year}-${String(item.month).padStart(2, '0')}`;
        if (!monthlyRevenue[monthYear]) {
            monthlyRevenue[monthYear] = 0;
        }
        monthlyRevenue[monthYear] += item.revenue;
    });

    const sortedMonths = Object.keys(monthlyRevenue).sort();
    const labels = sortedMonths.map(my => moment(my, 'YYYY-MM').format('MM/YYYY'));
    const revenues = sortedMonths.map(my => monthlyRevenue[my]);

    const ctx = document.getElementById('revenueChart').getContext('2d');

    if (revenueChartInstance) {
        revenueChartInstance.destroy(); // Hủy biểu đồ cũ
    }

    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu',
                data: revenues,
                backgroundColor: 'rgba(255, 193, 7, 0.8)', 
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: {
                        callback: function(value, index, values) {
                            return (value / 1000000).toFixed(0) + ' Tr'; 
                        }
                    }
                } 
            }
        }
    });
}

// Hàm cập nhật các chỉ số dashboard
function updateDashboard(bookings) {
    let totalRevenue = 0;
    let totalBooking = 0;

    bookings.filter(b => b.status === 'Hoàn thành' || b.status === 'Đã cọc').forEach(booking => {
        totalBooking++;
        totalRevenue += calculateBookingRevenue(booking.tourId, booking.quantity);
    });
    
    const avgRevenue = totalBooking > 0 ? totalRevenue / totalBooking : 0;

    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalBooking').textContent = totalBooking.toLocaleString('vi-VN');
    document.getElementById('avgRevenue').textContent = formatCurrency(avgRevenue);
}

// Hàm cập nhật bảng chi tiết booking
function updateBookingList(bookings) {
    const tbody = document.getElementById('bookingList');
    tbody.innerHTML = ''; 

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Không có booking nào được tìm thấy.</td></tr>';
        return;
    }

    bookings.forEach((booking, index) => {
        const tourName = getTourName(booking.tourId);
        const revenue = calculateBookingRevenue(booking.tourId, booking.quantity);

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${tourName}</td>
            <td>${booking.customerName || booking.email || 'Khách hàng'}</td>
            <td>${moment(booking.departureDate).format('DD/MM/YYYY')}</td>
            <td>${booking.quantity}</td>
            <td>${formatCurrency(revenue)}</td>
        `;
    });
}


// -----------------------------------------------------------
// III. HÀM LỌC CHÍNH
// -----------------------------------------------------------

async function applyFilter() {
    const monthValue = document.getElementById('monthFilter').value; // YYYY-MM
    const tourId = document.getElementById('tourFilter').value;

    // 1. Lấy dữ liệu Booking và Revenue
    // (Trong môi trường thực tế, bạn sẽ dùng API để lọc Booking trên Server)
    const allBookings = JSON.parse(localStorage.getItem('allBookings') || '[]');
    const revenuesData = await fetchData('revenues');

    // 2. Lọc Booking (Dùng cho Dashboard và Bảng Chi tiết)
    let filteredBookings = allBookings.filter(booking => {
        let match = true;
        
        // Lọc theo Tour
        if (tourId && String(booking.tourId) !== tourId) {
            match = false;
        }

        // Lọc theo Tháng
        if (monthValue) {
            const specificMonth = moment(monthValue, 'YYYY-MM').month(); // 0-11
            const specificYear = moment(monthValue, 'YYYY-MM').year();
            
            const bookingDate = moment(booking.departureDate);

            if (bookingDate.month() !== specificMonth || bookingDate.year() !== specificYear) {
                match = false;
            }
        }
        
        // Chỉ lấy các booking đã hoàn thành hoặc đã cọc (giả định đây là booking có doanh thu)
        if (booking.status !== 'Hoàn thành' && booking.status !== 'Đã cọc') {
            match = false;
        }

        return match;
    });

    // 3. Lọc Revenue (Dùng cho Biểu đồ)
    let filteredRevenues = revenuesData.filter(revenue => {
        let match = true;
        
        // Lọc theo Tour
        if (tourId && String(revenue.tourId) !== tourId) {
            match = false;
        }

        // Lọc theo Tháng/Năm
        if (monthValue) {
            const specificMonth = parseInt(monthValue.split('-')[1]);
            const specificYear = parseInt(monthValue.split('-')[0]);

            if (revenue.month !== specificMonth || revenue.year !== specificYear) {
                match = false;
            }
        }
        return match;
    });
    
    // 4. Cập nhật giao diện
    
    // Nếu lọc theo tháng, ta chỉ muốn Biểu đồ hiển thị cột của tháng đó (dùng data từ Revenue đã lọc)
    if (monthValue) {
        renderChart(filteredRevenues);
    } else {
        // Nếu không lọc theo tháng, Biểu đồ sẽ hiển thị xu hướng theo các tháng có dữ liệu
        renderChart(filteredRevenues);
    }
    
    updateDashboard(filteredBookings);
    updateBookingList(filteredBookings);
}

// Chạy hàm khởi tạo khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', initPage);