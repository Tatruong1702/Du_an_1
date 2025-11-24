// controllers/admin/dashboard.js

// Khai báo URL API (JSON Server)
const API_URL = "http://localhost:3000"; // Đảm bảo JSON Server đang chạy tại cổng này

// 1. DOM Selectors 
const tourCountEl = document.querySelector("#totalTours");
const bookingCountEl = document.querySelector("#totalBookings");
const revenueTotalEl = document.querySelector("#totalRevenue");
const costTotalEl = document.querySelector("#totalExpenses");
const profitTotalEl = document.querySelector("#netProfit");

const guideTableBody = document.querySelector("#guideListBody");
const departureTableBody = document.querySelector("#upcomingDeparturesBody");

const revenueChartCanvas = document.querySelector("#revenueChart"); // Selector cho Chart.js

// Hàm format tiền tệ (VND)
function formatCurrency(number) {
    if (typeof number !== 'number' || isNaN(number)) return '0đ';
    return number.toLocaleString("vi-VN") + "đ";
}

// Hàm xử lý lỗi fetch
function handleError(element, message, defaultValue = "...") {
    console.error(message);
    if (element) {
        element.textContent = defaultValue;
        element.style.color = "red";
    }
}

//2. LẤY TỔNG TOUR
async function loadTours() {
    try {
        const res = await fetch(`${API_URL}/tours`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        const data = await res.json();
        tourCountEl.textContent = data.length;
    } catch (error) {
        handleError(tourCountEl, "Lỗi khi tải tổng số tour: " + error.message);
    }
}

// 3. LẤY TỔNG BOOKING
async function loadBookings() {
    try {
        const res = await fetch(`${API_URL}/bookings`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        const data = await res.json();
        bookingCountEl.textContent = data.length;
    } catch (error) {
        handleError(bookingCountEl, "Lỗi khi tải tổng số booking: " + error.message);
    }
}

// 4. LẤY DOANH THU – CHI PHÍ – LỢI NHUẬN TỔNG & DỮ LIỆU THÔ
async function loadRevenueAndStats() {
    try {
        const res = await fetch(`${API_URL}/revenues`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        const data = await res.json();

        let totalRevenue = 0;
        let totalCost = 0;

        data.forEach(item => {
            totalRevenue += item.revenue || 0;
            totalCost += item.expense || 0;
        });
        const totalProfit = totalRevenue - totalCost;

        // Cập nhật thẻ thống kê
        revenueTotalEl.textContent = formatCurrency(totalRevenue);
        costTotalEl.textContent = formatCurrency(totalCost);
        profitTotalEl.textContent = formatCurrency(totalProfit);

        // Trả về dữ liệu thô để sử dụng cho biểu đồ
        return data;

    } catch (error) {
        handleError(revenueTotalEl, "Lỗi khi tải doanh thu: " + error.message);
        handleError(costTotalEl, "Lỗi khi tải chi phí: " + error.message);
        handleError(profitTotalEl, "Lỗi khi tính lợi nhuận: " + error.message);
        return []; // Trả về mảng rỗng nếu lỗi
    }
}

// 5. DANH SÁCH HƯỚNG DẪN VIÊN
async function loadGuides() {
    try {
        const res = await fetch(`${API_URL}/staffs`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        const data = await res.json();

        guideTableBody.innerHTML = data.map((g, i) => `
            <tr>
                <td>${i + 1}</td>
                <td class="fw-bold">${g.name || 'N/A'}</td>
                <td class="text-end">${g.experience || 'Chưa cập nhật'}</td> 
                <td class="text-end fw-semibold text-success">${g.toursLed !== undefined ? g.toursLed : 'N/A'}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Lỗi khi tải hướng dẫn viên:", error);
        guideTableBody.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Không thể tải dữ liệu</td></tr>`;
    }
}

// 6. LỊCH KHỞI HÀNH
async function loadDepartures() {
    try {
        const [departuresRes, toursRes, staffsRes] = await Promise.all([
            fetch(`${API_URL}/departures`),
            fetch(`${API_URL}/tours`),
            fetch(`${API_URL}/staffs`)
        ]);

        if (!departuresRes.ok || !toursRes.ok || !staffsRes.ok)
            throw new Error("Lỗi khi tải dữ liệu.");

        const departures = await departuresRes.json();
        const tours = await toursRes.json();
        const staffs = await staffsRes.json();

        // Tạo Map để tra cứu tên nhanh
        const tourMap = Object.fromEntries(tours.map(t => [String(t.id), t.name]));
        const guideMap = Object.fromEntries(staffs.map(s => [String(s.id), s.name]));

        function formatDate(v) {
            return new Date(v).toLocaleDateString("vi-VN");
        }
        const allDepartures = departures;

        if (allDepartures.length === 0) {
            departureTableBody.innerHTML = `<tr>
                <td colspan="5" class="text-center text-secondary">Không có lịch khởi hành nào.</td>
            </tr>`;
            return;
        }
        departureTableBody.innerHTML = allDepartures.map((d, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${tourMap[d.tourId] || "Không xác định"}</td>
                <td>${formatDate(d.dateStart)}</td>
                <td>${formatDate(d.dateEnd)}</td>
                <td>${guideMap[d.guideId] || "Chưa phân công"}</td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Lỗi khi tải lịch khởi hành:", err);
        departureTableBody.innerHTML = `<tr>
            <td colspan="5" class="text-danger text-center">Không thể tải dữ liệu</td>
        </tr>`;
    }
}

// 7. XỬ LÝ DỮ LIỆU & VẼ BIỂU ĐỒ (CHART.JS)


function processRevenueForChart(revenuesData) {
    const dataMap = {};

    revenuesData.forEach(item => {
        const key = `${item.month}/${item.year}`;
        if (!dataMap[key]) {
            dataMap[key] = { revenue: 0, expense: 0 };
        }
        dataMap[key].revenue += item.revenue || 0;
        dataMap[key].expense += item.expense || 0;
    });

    const processedData = Object.keys(dataMap).map(key => {
        const [month, year] = key.split('/').map(Number);
        const data = dataMap[key];
        // Tính Lợi nhuận
        const profit = data.revenue - data.expense;

        return {
            label: key,
            month: month,
            year: year,
            revenue: data.revenue,
            expense: data.expense,
            profit: profit
        };
    }).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });

    // Lấy 6 tháng gần nhất
    const lastSixMonths = processedData.slice(-6);

    return {
        labels: lastSixMonths.map(item => item.label),
        revenueData: lastSixMonths.map(item => item.revenue),
        expenseData: lastSixMonths.map(item => item.expense),
        profitData: lastSixMonths.map(item => item.profit)
    };
}


/**
 * Vẽ biểu đồ 3 CỘT (Doanh thu, Chi phí, Lợi nhuận) giống mẫu
 */
function renderRevenueChart(labels, revenueData, expenseData, profitData) {
    if (!revenueChartCanvas) return;

    const ctx = revenueChartCanvas.getContext('2d');
    if (window.revenueChartInstance) window.revenueChartInstance.destroy();

    window.revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                // DATASET 1: DOANH THU
                {
                    label: 'Doanh thu',
                    data: revenueData,
                    backgroundColor: '#5cb85c',
                    borderColor: '#4cae4c',
                    borderWidth: 1,
                    borderRadius: 2,
                    categoryPercentage: 0.8,
                    barPercentage: 0.8
                },
                // DATASET 2: CHI PHÍ 
                {
                    label: 'Chi phí',
                    data: expenseData,
                    backgroundColor: '#d9534f',
                    borderColor: '#c9302c',
                    borderWidth: 1,
                    borderRadius: 2,
                    categoryPercentage: 0.8,
                    barPercentage: 0.8
                },
                // DATASET 3: LỢI NHUẬN
                {
                    label: 'Lợi nhuận',
                    data: profitData,
                    backgroundColor: '#f0ad4e',
                    borderColor: '#eb9316',
                    borderWidth: 1,
                    borderRadius: 2,
                    categoryPercentage: 0.8,
                    barPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Báo cáo Doanh thu, Chi phí và Lợi nhuận theo tháng (VNĐ)',
                    font: { size: 16, weight: 'bold' },
                    color: '#3b2a0a'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: '#3b2a0a' }
                },
                tooltip: {
                    backgroundColor: 'rgba(59, 42, 10, 0.9)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        title: (context) => `Tháng ${context[0].label}`,
                        label: function (context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Thời gian', color: '#6c757d' },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Giá trị (VNĐ)', color: '#6c757d' },
                    ticks: {
                        callback: function (value) {
                            if (Math.abs(value) >= 1000000) {
                                return (value / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' Tr';
                            }
                            return formatCurrency(value);
                        },
                        color: '#3b2a0a'
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.08)' }
                }
            }
        }
    });
}


// CHẠY TẤT CẢ HÀM
async function initDashboard() {
    // Tải các chỉ số thống kê cơ bản
    await Promise.all([
        loadTours(),
        loadBookings(),
        loadGuides(),
        loadDepartures()
    ]);

    // Tải Doanh thu và Chi phí, đồng thời lấy dữ liệu thô
    const revenuesData = await loadRevenueAndStats();

    // Vẽ biểu đồ doanh thu và chi phí
    if (revenuesData && revenuesData.length > 0) {
        const { labels, revenueData, expenseData, profitData } = processRevenueForChart(revenuesData);
        renderRevenueChart(labels, revenueData, expenseData, profitData);
    } else if (revenueChartCanvas) {
        // Xử lý khi không có dữ liệu để vẽ biểu đồ
        revenueChartCanvas.style.display = 'none';
        const chartContainer = revenueChartCanvas.closest('.p-4.bg-white.rounded.shadow-sm');
        if (chartContainer) {
            chartContainer.innerHTML = '<p class="text-center text-muted m-0">Không có dữ liệu doanh thu để hiển thị biểu đồ.</p>';
        }
    }
}

// Chạy hàm khởi tạo khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', initDashboard);

// Gọi hàm khởi tạo
initDashboard();