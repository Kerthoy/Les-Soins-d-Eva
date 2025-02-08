document.addEventListener("DOMContentLoaded", function () {
    console.log("Valeur brute de localStorage:", localStorage.getItem("reservations"));

    // Récupération des réservations stockées
    let reservations = JSON.parse(localStorage.getItem("reservations")) || [];

    // Récupération des paramètres URL
    const params = new URLSearchParams(window.location.search);
    const soin = params.get("soin");
    const duree = params.get("duree");
    const prix = params.get("prix");

    const ajouterSoinBtn = document.getElementById("ajouter-soin-btn");
    const listeSoins = document.getElementById("liste-soins");
    const soinsSelectionnes = document.getElementById("soins-selectionnes");

    let soinsSupplementaires = params.get("soinsSupplementaires")
    ? JSON.parse(decodeURIComponent(params.get("soinsSupplementaires")))
    : [];

    cleanURL();

function cleanURL() {
    window.history.replaceState(null, "", window.location.pathname);
}

    const monthName = document.getElementById("month-name");
    const montControls = document.getElementById("month-controls")
    const calendarContainer = document.getElementById("calendar");
    const prevMonthButton = document.getElementById("prev-month");
    const nextMonthButton = document.getElementById("next-month");

    const slots = document.querySelectorAll(".slot");
    const reserveButton = document.getElementById("reserve-button");

    let selectedSlot = null;
    let selectedDate = null;
    let currentMonth = new Date();

    const today = new Date();

    // Vérification si soin, durée, et prix sont absents
    if (!soin && !duree && !prix) {
        // Masquer le conteneur de sélection
        document.querySelector("#selection-container").classList.add("hidden");

        // Masquer tout le calendrier
        document.getElementById("month-name").classList.add("hidden");
        document.getElementById("month-controls").classList.add("hidden");
        document.getElementById("calendar").classList.add("hidden");
        document.getElementById("prev-month").classList.add("hidden");
        document.getElementById("next-month").classList.add("hidden");

        // Masquer le bouton "Ajouter un soin..."
        document.getElementById("ajouter-soin-btn").classList.add("hidden");

        // Afficher la liste des soins
        document.getElementById("liste-soins").classList.remove("hidden");
    }

    // Afficher les données du soin dans le bloc sélection client
    document.getElementById("soin-nom").textContent = soin;
    document.getElementById("soin-duree").textContent = duree;
    document.getElementById("soin-prix").textContent = prix;

    // Fonction pour mettre à jour l'URL et masquer les paramètres
    function updateURL() {
        const params = new URLSearchParams(window.location.search);
        params.set("soinsSupplementaires", encodeURIComponent(JSON.stringify(soinsSupplementaires)));
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
    }

    // Suppression du soin déjà présent au chargement de la page
    const soinExistants = document.querySelectorAll(".soin-details .close-btn");

    soinExistants.forEach(btn => {
        btn.addEventListener("click", function () {
            if (confirm("Êtes-vous sûr de vouloir supprimer ce soin ?")) {
                const soinBloc = this.closest(".soin-details");
                soinBloc.remove();
                verifierNbSoins();

                // Mettre à jour l'URL en supprimant soin, duree et prix
                const params = new URLSearchParams(window.location.search);

                // Vérifier si le soin principal est supprimé
                if (!document.querySelector(".soin-details")) {
                    // Si plus de soins principaux, mettre soin, duree, prix à null
                    params.delete("soin");
                    params.delete("duree");
                    params.delete("prix");
                }

                // Remplacer l'URL sans recharger la page
                const newUrl = `${window.location.pathname}?${params.toString()}`;
                window.history.replaceState(null, "", newUrl);
            }
        });
    });

    // Masquer les créneaux au chargement
    document.getElementById("slots").style.display = 'none';

    function updateCalendar() {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const monthNames = [
            "janvier", "février", "mars", "avril", "mai", "juin",
            "juillet", "août", "septembre", "octobre", "novembre", "décembre"
        ];

        monthName.textContent = `${monthNames[month]} ${year}`;
        calendarContainer.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            dayHeader.textContent = day;
            calendarContainer.appendChild(dayHeader);
        });

        const adjustedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        for (let i = 0; i < adjustedFirstDay; i++) {
            const emptyDay = document.createElement('div');
            calendarContainer.appendChild(emptyDay);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayButton = document.createElement('button');
            dayButton.classList.add('day-button');
            dayButton.textContent = i;

            const dayOfWeek = (adjustedFirstDay + i - 1) % 7;
            const dayDate = new Date(year, month, i);
            const formattedDate = `${i} ${monthNames[month]} ${year}`;

            if (dayDate < today || dayOfWeek === 5 || dayOfWeek === 6) {
                dayButton.classList.add("non-clickable");
                dayButton.disabled = true;
            }

            dayButton.addEventListener("click", () => {
                document.querySelectorAll(".day-button.selected").forEach(button => button.classList.remove("selected"));
                dayButton.classList.add("selected");

                selectedDate = formattedDate;
                checkConditions();

                // Afficher les créneaux après sélection d'une date
                document.getElementById("slots").style.display = 'block';

                // Vérifier et désactiver les créneaux déjà réservés pour ce jour
                disableReservedSlots(selectedDate);
            });

            calendarContainer.appendChild(dayButton);
        }
    }

    function disableReservedSlots(selectedDate) {
        const reservedSlots = reservations
            .filter(reservation => reservation.date === selectedDate)
            .map(reservation => reservation.creneau);

        document.querySelectorAll(".slot").forEach(slot => {
            const slotTime = slot.textContent;
            if (reservedSlots.includes(slotTime)) {
                slot.classList.add("reserved");
                slot.disabled = true;
            } else {
                slot.classList.remove("reserved");
                slot.disabled = false;
            }
        });
    }

    slots.forEach(slot => {
        slot.addEventListener("click", () => {
            if (slot.disabled) return;

            if (selectedSlot) {
                selectedSlot.classList.remove("selected");
            }
            slot.classList.add("selected");
            selectedSlot = slot;
            checkConditions();
        });
    });

    function checkConditions() {
        const isSlotSelected = selectedSlot !== null;
        const isDateSelected = selectedDate !== null;

        if (isSlotSelected && isDateSelected) {
            reserveButton.disabled = false;
            reserveButton.classList.add("active");
        } else {
            reserveButton.disabled = true;
            reserveButton.classList.remove("active");
        }
    }

    prevMonthButton.addEventListener("click", () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        updateCalendar();
    });

    nextMonthButton.addEventListener("click", () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        updateCalendar();
    });

    updateCalendar();

    slots.forEach(slot => {
        slot.addEventListener("click", () => {
            if (selectedSlot) {
                selectedSlot.classList.remove("selected");
            }
            slot.classList.add("selected");
            selectedSlot = slot;
            checkConditions();
        });
    });

    function verifierNbSoins() {
        const nbSoins = document.querySelectorAll(".soin-details").length;
        if (nbSoins === 0) {
            soinsSelectionnes.classList.remove("hidden");
        }
        document.getElementById("ajouter-soin-btn").classList.remove("hidden");
    }

    ajouterSoinBtn.addEventListener("click", function () {
        listeSoins.classList.toggle("hidden");
        monthName.classList.add("hidden");
        montControls.classList.add("hidden");
        calendarContainer.classList.add("hidden");
        prevMonthButton.classList.add("hidden");
        nextMonthButton.classList.add("hidden");
        document.getElementById("slots").style.display = 'none';
    });

    document.querySelectorAll(".btn-reserver").forEach(btn => {
        btn.addEventListener("click", function (event) {
            event.preventDefault();

            monthName.classList.remove("hidden");
            montControls.classList.remove("hidden");
            calendarContainer.classList.remove("hidden");
            prevMonthButton.classList.remove("hidden");
            nextMonthButton.classList.remove("hidden");

            const soinNom = this.getAttribute("data-soin");
            const soinDuree = this.getAttribute("data-duree");
            const soinPrix = this.getAttribute("data-prix");

            const newSoinBloc = document.createElement("div");
            newSoinBloc.classList.add("soin-details");
            newSoinBloc.innerHTML = `
                <span class="close-btn">&times;</span>
                <div class="soin-nom">${soinNom}</div>
                <div class="details-bas">
                    <span>${soinDuree}</span>
                    <span>${soinPrix}</span>
                </div>
            `;

            soinsSelectionnes.appendChild(newSoinBloc);
            soinsSupplementaires.push({
                soinNom: soinNom,
                soinPrix: soinPrix
            });

            updateURL();  // Mettez à jour l'URL ici
            verifierNbSoins();

            newSoinBloc.querySelector(".close-btn").addEventListener("click", function () {
                if (confirm("Êtes-vous sûr de vouloir supprimer ce soin ?")) {
                    newSoinBloc.remove();
                    soinsSupplementaires = soinsSupplementaires.filter(soin => soin.soinNom !== soinNom);
                    updateURL();
                    verifierNbSoins();
                }
            });

            // Réafficher le calendrier et masquer les slots
            listeSoins.classList.add("hidden");
            ajouterSoinBtn.classList.remove("hidden");
        });
    });

    reserveButton.addEventListener("click", function () {
        if (selectedSlot && selectedDate) {
            const selectedTime = selectedSlot.textContent;

            // Vérifier si le soin principal est toujours présent
            const soinElement = document.getElementById("soin-nom");
            const soinPrincipal = soinElement && soinElement.textContent.trim() ? soinElement.textContent.trim() : null;

            let soinsSupplementairesEncoded = encodeURIComponent(JSON.stringify(soinsSupplementaires));

            if (!soinPrincipal) {
                // Soin principal supprimé => on envoie uniquement la date, le créneau et les soins supplémentaires
                localStorage.setItem("reservationDetails", JSON.stringify({
                    date: selectedDate,
                    creneau: selectedTime,
                    soinsSupplementaires: soinsSupplementaires.length > 0 ? soinsSupplementaires : null,
                }));

                const url = `formulaire.html?ldate=${encodeURIComponent(selectedDate)}&creneau=${encodeURIComponent(selectedTime)}&soinsSupplementaires=${soinsSupplementairesEncoded}`;
                window.location.href = url;

            } else {
                // Sinon, on enregistre normalement avec soin principal et soins supp
                localStorage.setItem("reservationDetails", JSON.stringify({
                    soin: soinPrincipal,
                    date: selectedDate,
                    creneau: selectedTime,
                    prix: prix,
                    soinsSupplementaires: soinsSupplementaires.length > 0 ? soinsSupplementaires : null,
                }));

                const url = `formulaire.html?soin=${encodeURIComponent(soinPrincipal)}&duree=${encodeURIComponent(duree)}&prix=${encodeURIComponent(prix)}&ldate=${encodeURIComponent(selectedDate)}&creneau=${encodeURIComponent(selectedTime)}&soinsSupplementaires=${soinsSupplementairesEncoded}`;
                window.location.href = url;
            }
        }

        
    });
});
