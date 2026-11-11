document.querySelector('#inicio').addEventListener('click', () => {
            document.querySelector("#dificuldade").style.display = "block";
            document.querySelector('#ranking').style.display = "none";
        });


        document.querySelector('#facil').addEventListener('click', () => {
            document.querySelector("#dificuldade").style.display = "none";
            localStorage.setItem('dificuldade', 0);
            location.href = "disfarcando.html";
        });
        document.querySelector('#normal').addEventListener('click', () => {
            document.querySelector("#dificuldade").style.display = "none";
            localStorage.setItem('dificuldade', 1);
            location.href = "disfarcando.html";
        });
        document.querySelector('#dificil').addEventListener('click', () => {
            document.querySelector("#dificuldade").style.display = "none";
            localStorage.setItem('dificuldade', 2);
            location.href = "disfarcando.html";
        });
        document.querySelector('#impossivel').addEventListener('click', () => {
            document.querySelector("#dificuldade").style.display = "none";
            localStorage.setItem('dificuldade', 3);
            location.href = "disfarcando.html";
        });

        document.querySelector('#ranking').addEventListener('click', () => {
            location.href = "ranking.html";
        });