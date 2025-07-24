//Esto incluye el footer en cada una de las paginas de sesiones

function includeHTML(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

includeHTML("footer", "components/footer.html");