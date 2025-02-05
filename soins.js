document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".btn-reserver").forEach(button => {
        button.addEventListener("click", function () {
            let soin = this.dataset.soin; // Récupère le nom du soin
            let duree = this.dataset.duree; // Récupère la durée du soin
            let prix = this.dataset.prix; // Récupère le prix du soin

            // Encode les informations et redirige vers la page de réservation
            window.location.href = `reservation.html?soin=${encodeURIComponent(soin)}&duree=${encodeURIComponent(duree)}&prix=${encodeURIComponent(prix)}`;
        });
    });
});
