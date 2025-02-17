function startDrawing() {
    window.location.href = "canvas.html";
}

const background = document.querySelector('.background');

document.addEventListener('mousemove', (event) => {
    const { clientX, clientY } = event;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const moveX = (clientX - centerX) * 0.02;
    const moveY = (clientY - centerY) * 0.02;

    background.style.transform = `translate(${moveX}px, ${moveY}px)`;
});
