document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const closeBtn = document.getElementById("close-btn");
    const dropdown = document.querySelector(".dropdown");
    const arrow = dropdown.querySelector(".arrow");

    // Ouvrir le menu
    menuToggle.addEventListener("click", function () {
        sidebar.classList.add("active");
    });

    // Fermer le menu
    function closeMenu() {
        sidebar.classList.remove("active");
        dropdown.classList.remove("active"); // Réinitialise le sous-menu
    }

    closeBtn.addEventListener("click", closeMenu);

    // Gérer le clic sur la flèche
    arrow.addEventListener("click", function (event) {
        event.stopPropagation(); // Empêche la propagation pour ne pas affecter le lien
        dropdown.classList.toggle("active");
    });

    // Fermer le menu si clic en dehors
    document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            closeMenu();
        }
    });
});
