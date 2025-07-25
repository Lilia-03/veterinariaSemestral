//Esto incluye el navbar y el footer en la pagina de login

function includeHTML(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

includeHTML("navbarLogin", "assets/components/navLogin.html");
includeHTML("footer", "assets/components/footer.html");