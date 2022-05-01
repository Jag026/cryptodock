function filterFunction() {
    var input, filter, ul, li, a, i;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("myDropdown");
    coins = document.getElementById("coins");
    a = div.getElementsByTagName("a");
    img = div.getElementsByTagName("img");
    button = div.getElementsByTagName("button");
    for (i = 0; i < a.length; i++) {
        txtValue = a[i].textContent || a[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
            img[i].style.display = ""
            button[i].style.display = "";
            if (i > 5) {
                a[i].style.display = "";
                img[i].style.display = ""
                button[i].style.display = "";
            } 
        } else {
            a[i].style.display = "none";
            img[i].style.display = "none"
            button[i].style.display = "none";
        }
        
    }
}