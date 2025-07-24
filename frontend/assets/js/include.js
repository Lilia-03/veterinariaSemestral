//Esto incluye el navbar y el footer en las paginas de presentación

function includeHTML(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

includeHTML("navbar", "components/nav.html");
includeHTML("footer", "components/footer.html");