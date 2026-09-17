const button = document.querySelector('.metallic-button');

if (button) {
  button.addEventListener('pointermove', (event) => {
    const rect = button.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    button.style.setProperty('--pointer-x', `${x}%`);
    button.style.setProperty('--pointer-y', `${y}%`);

    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * -12;
    button.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-1px)`;
  });

  button.addEventListener('pointerleave', () => {
    button.style.transform = '';
    button.style.setProperty('--pointer-x', '50%');
    button.style.setProperty('--pointer-y', '50%');
  });

  button.addEventListener('click', () => {
    button.animate(
      [
        { transform: 'scale(0.98)' },
        { transform: 'scale(1.02)' },
        { transform: 'scale(1)' },
      ],
      {
        duration: 220,
        easing: 'ease-out',
      }
    );
  });
}
