// The reel: each row drifts slowly on its own, and visitors can drag, swipe or
// trackpad-scroll it. Rows loop seamlessly, pause while someone is looking, and
// a photo that opens partly off-screen slides fully into view.

const SPEED = 0.5; // pixels per frame at 60fps
const IDLE_MS = 2500; // how long to wait after someone scrolls before drifting again
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('.reel-row').forEach((row) => {
  const track = row.querySelector('.reel-track');
  const originals = Array.from(track.children);

  // Copy the frames once so the row can wrap around without a gap.
  originals.forEach((frame) => {
    const copy = frame.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('tabindex');
    track.appendChild(copy);
  });

  const direction = row.classList.contains('reel-row--reverse') ? -1 : 1;
  const period = () => track.children[originals.length].offsetLeft - originals[0].offsetLeft;

  // pos is kept as a float: some screens round scrollLeft to whole pixels,
  // which would otherwise stop a slow drift dead.
  let pos = 0;
  let target = null; // where a photo being revealed should end up
  let hovering = false;
  let pausedUntil = 0;
  let last = performance.now();

  requestAnimationFrame(() => {
    pos = direction < 0 ? period() / 2 : 1;
    row.scrollLeft = pos;
  });

  const pause = () => { pausedUntil = performance.now() + IDLE_MS; };
  const isOpen = () => row.querySelector('.frame.is-open, .frame:focus-visible');

  const tick = (now) => {
    const dt = Math.min(now - last, 50) / (1000 / 60);
    last = now;
    const drifting = !reduceMotion && !hovering && !dragging && now > pausedUntil && !isOpen();

    if (target !== null) {
      pos += (target - pos) * Math.min(0.2 * dt, 1);
      if (Math.abs(target - pos) < 0.5) { pos = target; target = null; }
    } else if (drifting) {
      pos += SPEED * dt * direction;
    } else {
      // Someone is scrolling by hand: follow them instead of fighting them.
      pos = row.scrollLeft;
    }

    // Keep the position inside one loop's worth so it never runs out.
    const p = period();
    if (pos >= p) { pos -= p; if (target !== null) target -= p; }
    else if (pos <= 0) { pos += p; if (target !== null) target += p; }

    if (Math.abs(row.scrollLeft - pos) >= 0.5) row.scrollLeft = pos;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  row.addEventListener('mouseenter', () => { hovering = true; });
  row.addEventListener('mouseleave', () => { hovering = false; });
  row.addEventListener('wheel', pause, { passive: true });
  row.addEventListener('touchstart', pause, { passive: true });
  row.addEventListener('touchmove', pause, { passive: true });
  row.addEventListener('focusin', pause);

  // Drag to scroll with a mouse (touch screens swipe natively).
  let dragging = false;
  let moved = 0;
  let startX = 0;
  let startScroll = 0;

  row.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragging = true;
    moved = 0;
    startX = event.clientX;
    startScroll = row.scrollLeft;
  });

  window.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 4) row.classList.add('is-dragging');
    row.scrollLeft = startScroll - dx;
  });

  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    row.classList.remove('is-dragging');
    pause();
  });

  // A drag shouldn't also count as a tap on a photo.
  row.addEventListener('click', (event) => {
    if (moved > 4) {
      event.stopPropagation();
      moved = 0;
    }
  }, true);

  // Slide a photo fully into view when it is hovered, focused or tapped open.
  const reveal = (frame) => {
    const rowBox = row.getBoundingClientRect();
    const box = frame.getBoundingClientRect();
    const margin = 16;
    let shift = 0;
    // A photo wider than the screen lines up with the left edge.
    if (box.left < rowBox.left + margin || box.width > rowBox.width - 2 * margin) {
      shift = box.left - rowBox.left - margin;
    } else if (box.right > rowBox.right - margin) {
      shift = box.right - rowBox.right + margin;
    }
    if (Math.abs(shift) < 1) return;
    pos = row.scrollLeft;
    target = pos + shift;
    if (reduceMotion) { pos = target; target = null; row.scrollLeft = pos; }
  };

  track.querySelectorAll('.frame').forEach((frame) => {
    frame.addEventListener('mouseenter', () => { if (!dragging) reveal(frame); });
    frame.addEventListener('focus', () => reveal(frame));
  });
  row.addEventListener('reel:open', (event) => reveal(event.target));
});

// On touch screens there is no hover, so a tap opens a photo's note and a second tap closes it.
document.addEventListener('click', (event) => {
  const frame = event.target.closest('.frame');
  document.querySelectorAll('.frame.is-open').forEach((open) => {
    if (open !== frame) open.classList.remove('is-open');
  });
  if (!frame) return;
  frame.classList.toggle('is-open');
  if (frame.classList.contains('is-open')) {
    frame.dispatchEvent(new CustomEvent('reel:open', { bubbles: true }));
  }
});
