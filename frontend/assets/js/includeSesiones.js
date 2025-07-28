//Esto incluye el footer en cada una de las paginas de sesiones

function includeHTML(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        });
}

includeHTML("footer", "../frontend/assets/components/footer.html");