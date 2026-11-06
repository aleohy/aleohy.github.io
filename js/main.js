// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  if (!toggle) return;
  var header = document.querySelector(".site-header");

  toggle.addEventListener("click", function () {
    var open = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && header.classList.contains("nav-open")) {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
})();

// Home: the puck nearest the cursor lights up its ring
(function () {
  var art = document.querySelector(".door-art");
  if (!art || !window.matchMedia("(hover: hover)").matches) return;

  var pucks = Array.prototype.slice.call(art.querySelectorAll(".puck"));
  var current = null;

  art.addEventListener("mousemove", function (e) {
    var nearest = null;
    var best = Infinity;
    pucks.forEach(function (p) {
      var r = p.getBoundingClientRect();
      var dx = r.left + r.width / 2 - e.clientX;
      var dy = r.top + r.height / 2 - e.clientY;
      var d = dx * dx + dy * dy;
      if (d < best) { best = d; nearest = p; }
    });
    if (nearest !== current) {
      if (current) current.classList.remove("is-near");
      if (nearest) nearest.classList.add("is-near");
      current = nearest;
    }
  });

  art.addEventListener("mouseleave", function () {
    if (current) current.classList.remove("is-near");
    current = null;
  });
})();
