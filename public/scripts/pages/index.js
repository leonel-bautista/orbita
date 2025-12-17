const devicesList = document.querySelector('section#devices .devices-list');
const deviceLeftBtn = document.getElementById('device-left-btn');
const deviceRightBtn = document.getElementById('device-right-btn');

deviceLeftBtn.addEventListener('click', () => {
    devicesList.scrollBy({
        left: -600,
        behavior: 'smooth'
    });
})
deviceRightBtn.addEventListener('click', () => {
    devicesList.scrollBy({
        left: 600,
        behavior: 'smooth'
    });
})