const API_URL = "http://localhost:3000"; // Đảm bảo JSON Server đang chạy tại cổng này

// 1. DOM Selectors 
const tourCountEl = document.querySelector("#totalTours"); 
const bookingCountEl = document.querySelector("#totalBookings"); 
const revenueTotalEl = document.querySelector("#totalRevenue"); 
const costTotalEl = document.querySelector("#totalExpenses"); 
const profitTotalEl = document.querySelector("#netProfit"); 

const guideTableBody = document.querySelector("#guideListBody"); 
const departureTableBody = document.querySelector("#upcomingDeparturesBody"); 

// Hàm chung để format tiền tệ (VND)
function formatCurrency(number) {
    if (typeof number !== 'number') return '0đ';
    return number.toLocaleString("vi-VN") + "đ";
}

// Hàm xử lý lỗi fetch
function handleError(element, message, defaultValue = "Lỗi") {
    console.error(message);
    if (element) {
        element.textContent = defaultValue;
        element.style.color = "red";
    }
}

// ========== 2. LẤY TỔNG TOUR ==========
async function loadTours() {
    try {
        const res = await fetch(`${API_URL}/tours`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        const data = await res.json();
        // Lấy tổng số lượng tất cả tour bằng .length
        tourCountEl.textContent = data.length; 
    } catch (error) {
        handleError(tourCountEl, "Lỗi khi tải tổng số tour: " + error.message, "...");
    }
}

// ========== 3. LẤY TỔNG BOOKING ==========
async function loadBookings() {
    try {
        const res = await fetch(`${API_URL}/bookings`);
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        const data = await res.json();
        bookingCountEl.textContent = data.length;
    } catch (error) {
        handleError(bookingCountEl, "Lỗi khi tải tổng số booking: " + error.message, "...");
    }
}

// ========== 4. LẤY DOANH THU, CHI PHÍ, LỢI NHUẬN ==========
async function loadRevenue() {
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

        revenueTotalEl.textContent = formatCurrency(totalRevenue);
        costTotalEl.textContent = formatCurrency(totalCost);
        profitTotalEl.textContent = formatCurrency(totalRevenue - totalCost);
    } catch (error) {
        // Xử lý lỗi cho các trường số liệu
        handleError(revenueTotalEl, "Lỗi khi tải dữ liệu doanh thu: " + error.message, "...");
        handleError(costTotalEl, "Lỗi khi tải dữ liệu chi phí: " + error.message, "...");
        handleError(profitTotalEl, "Lỗi khi tính lợi nhuận: " + error.message, "...");
    }
}

// ========== 5. DANH SÁCH HƯỚNG DẪN VIÊN ==========
async function loadGuides() {
    try {
        const res = await fetch(`${API_URL}/staffs`); 
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        const data = await res.json();

        if (guideTableBody) {
            guideTableBody.innerHTML = data
                .map((g, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td class="fw-bold">${g.name}</td>
                        <td class="text-end">${g.experience}</td> 
                        <td class="text-end fw-semibold text-success">${g.toursLed}</td>
                        <td class="text-center"><a href="#" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i></a></td> 
                    </tr>
                `)
                .join("");
        }
    } catch (error) {
        // ... (xử lý lỗi)
    }
}
// ========== 6. LỊCH KHỞI HÀNH SẮP TỚI (Cần liên kết dữ liệu) ==========
async function loadDepartures() {
    try {
        // 1. Lấy tất cả dữ liệu cần thiết
        const [departuresRes, toursRes, staffsRes] = await Promise.all([
            fetch(`${API_URL}/departures`),
            fetch(`${API_URL}/tours`),
            fetch(`${API_URL}/staffs`)
        ]);

        if (!departuresRes.ok || !toursRes.ok || !staffsRes.ok) 
            throw new Error("Lỗi khi tải một hoặc nhiều nguồn dữ liệu.");

        const departures = await departuresRes.json();
        const tours = await toursRes.json();
        const staffs = await staffsRes.json();

        // Tạo map để tra cứu nhanh tên Tour và HDV
        const tourMap = tours.reduce((map, t) => ({ ...map, [t.id]: t.name }), {});
        const guideMap = staffs.reduce((map, s) => ({ ...map, [s.id]: s.name }), {});

        if (departureTableBody) {
            departureTableBody.innerHTML = departures
                .map((d, i) => {
                    const tourName = tourMap[d.tourId] || "Không xác định";
                    const guideName = guideMap[d.guideId] || "Chưa phân công";

                    // Format ngày tháng (ví dụ: 2025-11-20 -> 20/11/2025)
                    const formatDate = (dateString) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('vi-VN');
                    };

                    return `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${tourName}</td>
                            <td>${formatDate(d.dateStart)}</td>
                            <td>${formatDate(d.dateEnd)}</td>
                            <td>${guideName}</td>
                        </tr>
                    `;
                })
                .join("");
        }
    } catch (error) {
        console.error("Lỗi khi tải lịch khởi hành:", error);
        if (departureTableBody) departureTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Không thể tải dữ liệu lịch khởi hành.</td></tr>';
    }
}

// Chạy tất cả các hàm khi script được tải
loadTours();
loadBookings();
loadRevenue();
loadGuides();
loadDepartures();