
const param = new URLSearchParams(window.location.search);
const id = param.get('id');

const getTourById = async () => {
  try {
    const res = await fetch(`http://localhost:3000/tours/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy tour');
    const data = await res.json();

    document.querySelector('#name').textContent = data.name;
    document.querySelector('#type').textContent = data.type;
    document.querySelector('#price').textContent =
      `${data.price.child.toLocaleString()}~${data.price.adult.toLocaleString()}đ`;
    document.querySelector('.tour-card img').src = data.images;
    document.querySelector('#tourLongDesc').textContent = data.short_description;
    document.querySelector('#tour_code').textContent = data.tour_code;

    const depRes = await fetch(`http://localhost:3000/departures?tourId=${id}`);
    const Departures = await depRes.json();

    const departuresContainer = document.querySelector('#departures');
    if(Departures.length === 0){
      departuresContainer.innerHTML += `<p class="fs-5 text-danger">Chưa có chuyến khởi hành nào cho tour này</p>`
    }else{
      const firstDep = Departures[0]; 
      document.querySelector('#dateStart').textContent = firstDep.dateStart;
      document.querySelector('#dateEnd').textContent = firstDep.dateEnd;
      document.querySelector('#meetingPoint').textContent = firstDep.meetingPoint;


    }
  } catch (error) {
    console.error('Lỗi tải tour:', error);
  }
}

getTourById();
console.log('Hello');

