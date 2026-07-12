let btnTabs = document.getElementsByClassName("btntab");
let tabs = document.getElementsByClassName("tab");
let lastTab = -1;
for (let i = 0; i < btnTabs.length; i++) {
    btnTabs[i].onclick = function() {
        tabs[i].style.display = "";
        if (lastTab >= 0) tabs[lastTab].style.display = "none";
        lastTab = i;
    }
}
