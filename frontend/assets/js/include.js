//Esto incluye el navbar y el footer en las paginas de presentación

function includeHTML(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

includeHTML("navbar", "assets/components/nav.html");
includeHTML("footer", "assets/components/footer.html");