let btnTabs = document.getElementsByClassName("btntab");
let tabs = document.getElementsByClassName("tab");
let lastTab = -1;
for (let i = 0; i < btnTabs.length; i++) {
    btnTabs[i].onclick = function() {
        if (i == lastTab) return;
        tabs[i].style.display = "";
        if (lastTab >= 0) tabs[lastTab].style.display = "none";
        lastTab = i;
    }
}
