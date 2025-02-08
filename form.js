document.addEventListener("DOMContentLoaded", function () {
    loadSoinsFromStorage();
    emailjs.init("ozNyarxJVstgl7vvQ"); // Initialisation EmailJS
    console.log("Formulaire chargé");

    // Charge les soins depuis le local storage et les affiche
    function loadSoinsFromStorage() {
        let soins = JSON.parse(localStorage.getItem("soins")) || [];
        displaySoins(soins);
    }

    // Affiche les soins sur la page
    function displaySoins(soins) {
        const soinsContainer = document.getElementById("soins-supp-container");
        if (!soinsContainer) {
            console.error("Erreur : l'élément #soins-supp-container est introuvable.");
            return;
        }
        soinsContainer.innerHTML = "";
        soins.forEach(soin => {
            const soinElement = document.createElement("div");
            soinElement.classList.add("soin-item");
            soinElement.textContent = soin.name;
            soinsContainer.appendChild(soinElement);
        });
    }

    // Récupération des paramètres URL
    const params = new URLSearchParams(window.location.search);
    let soinsSupplementaires = params.get("soinsSupplementaires") 
        ? JSON.parse(decodeURIComponent(params.get("soinsSupplementaires")))
        : [];
    console.log("Soins supplémentaires récupérés :", soinsSupplementaires);

    let soin = params.get("soin"); // Peut être null
    const date = params.get("ldate") || "Non spécifié";
    const creneau = params.get("creneau") || "Non spécifié";
    let prix = params.get("prix"); // Peut être null

    // Si aucun soin principal n'est défini, prendre le premier soin supplémentaire
    if (!soin || soin === "null") {
        if (soinsSupplementaires.length > 0) {
            // Le premier soin supplémentaire devient le soin principal
            const premierSoin = soinsSupplementaires.shift(); // Retire et récupère le premier élément
            soin = premierSoin.soinNom;
            prix = premierSoin.soinPrix;
        } else {
            soin = "Non spécifié";
            prix = "--";
        }
    }

    // Mise à jour des éléments HTML
    document.getElementById("soin-value").textContent = soin;
    document.getElementById("date-value").textContent = `${date} à ${creneau}`;
    document.getElementById("prix-detail-value").textContent = prix;

    // Sélection des conteneurs
    const soinsContainer = document.querySelector("#soins-supp-container"); // Conteneur des soins
    const prixContainer = document.querySelector("#prix-supp-container"); // Conteneur des prix
    const totalContainer = document.querySelector("#total-prix-container"); // Conteneur du total
    const totalPrixValue = document.querySelector("#total-prix-value"); // Valeur du prix total

    // Initialiser le prix total avec le prix du soin principal
    let totalPrix = parseFloat(prix) || 0;

    // Vérifier s'il reste des soins supplémentaires
    if (soinsSupplementaires.length > 0) {
        // Afficher les sections
        soinsContainer.classList.remove("hidden");
        prixContainer.classList.remove("hidden");
        totalContainer.classList.remove("hidden");

        // Ajouter chaque soin supplémentaire dans les conteneurs correspondants
        soinsSupplementaires.forEach((soin) => {
            // Créer une ligne pour afficher le nom du soin supplémentaire
            const soinLine = document.createElement("div");
            soinLine.classList.add("line");
            soinLine.innerHTML = `<p class="soin-supp">${soin.soinNom}</p>`;

            // Créer une ligne pour afficher le prix du soin supplémentaire
            const prixLine = document.createElement("div");
            prixLine.classList.add("line");
            prixLine.innerHTML = `<p class="prix-supp">${soin.soinPrix}</p>`;

            // Ajouter les lignes créées dans leurs conteneurs respectifs
            soinsContainer.appendChild(soinLine);
            prixContainer.appendChild(prixLine);

            totalPrix += parseFloat(soin.soinPrix) || 0;
        });

        totalPrixValue.textContent = `${totalPrix.toFixed(2)} €`;
    } else {
        console.log("Aucun soin supplémentaire trouvé.");
        totalContainer.classList.add("hidden");
        totalPrixValue.textContent = `${totalPrix.toFixed(2).replace(/\.00$/, "")} €`;
    }

    // Masquer les paramètres dans l'URL (remplacer l'URL proprement)
    window.history.replaceState(null, "", window.location.origin + window.location.pathname);

    // Activer le bouton de confirmation si les champs sont remplis
    const confirmButton = document.getElementById("confirm-button");
    const nomPrenom = document.getElementById("nomPrenom");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");

    function checkFormCompletion() {
        confirmButton.disabled = !(nomPrenom.value.trim() && email.value.trim() && phone.value.trim());
    }

    nomPrenom.addEventListener("input", checkFormCompletion);
    email.addEventListener("input", checkFormCompletion);
    phone.addEventListener("input", checkFormCompletion);

    // Gestion du clic sur le bouton de confirmation
    confirmButton.addEventListener("click", function () {
        const reservationData = {
            nomPrenom: nomPrenom.value,
            email: email.value,
            phone: phone.value,
            soin: document.getElementById("soin-value").textContent,
            date: document.getElementById("date-value").textContent.split(" à ")[0], // Extraire la date
            creneau: document.getElementById("date-value").textContent.split(" à ")[1], // Extraire l'heure
            prix: document.getElementById("prix-detail-value").textContent,
            infoComplementaires: document.getElementById("infoComplementaires").value
        };

        // Vérifier si soinsSupplementaires est défini et non vide
        if (soinsSupplementaires.length > 0) {
            reservationData.soinsSupplementaires = soinsSupplementaires;
        }

        // Récupérer les réservations existantes
        let reservations = JSON.parse(localStorage.getItem("reservations")) || [];

        // Ajouter la nouvelle réservation
        reservations.push(reservationData);

        // Sauvegarder dans localStorage
        localStorage.setItem("reservations", JSON.stringify(reservations));

        // Construire l'objet des soins supplémentaires pour l'email
        const soinsSupplementairesEmail = soinsSupplementaires.map(soin => ({
            soinNom: soin.soinNom,
            soinPrix: soin.soinPrix
        }));

        // Calcul du total prix à envoyer
        const totalPrix = soinsSupplementaires.reduce((total, soin) => total + parseFloat(soin.soinPrix || 0), parseFloat(prix) || 0);

        // Ajouter ces données à reservationData
        reservationData.soinsSupplementaires = soinsSupplementairesEmail.length > 0 ? soinsSupplementairesEmail : null;
        reservationData.totalPrix = `${totalPrix.toFixed(2)} €`;

        // Envoyer les données avec EmailJS (nécessite une configuration)
        emailjs.send("service_0ng92qr", "template_ybf7aeo", reservationData)
            .then(function (response) {
                alert("Réservation confirmée avec succès !");
                window.location.href = "validation.html";
            }, function (error) {
                console.log("Échec de l'envoi :", error);
                alert("Une erreur est survenue. Veuillez réessayer.");
            });
    });
});
