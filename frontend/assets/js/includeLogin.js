//Esto incluye el navbar y el footer en la pagina de login

function includeHTML(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

includeHTML("navbarLogin", "components/navLogin.html");
includeHTML("footer", "components/footer.html");