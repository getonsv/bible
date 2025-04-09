window.addEventListener("message", function(event) {
        document.getElementById("projectionContent").innerHTML = event.data;
      });
