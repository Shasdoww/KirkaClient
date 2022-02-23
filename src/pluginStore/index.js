document.addEventListener('DOMContentLoaded', () => {
    makeCollapsible();
    $.ajax({
        url: 'http://127.0.0.1:5000/api/plugins',
        complete: (res) => {
            const data = res.responseJSON;
            console.log(data);
        }
    });
});

function makeCollapsible() {
    const coll = document.getElementsByClassName('collapsible');

    for (let i = 0; i < coll.length; i++) {
        coll[i].addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === 'flex') {
                content.style.display = 'none';
                this.firstElementChild.innerText = 'arrow_right';
            } else {
                content.style.display = 'flex';
                this.firstElementChild.innerText = 'arrow_drop_down';
            }
        });
    }
}

function paintCards(data) {
    data.forEach(d => {
        const card = document.createElement('div');
        card.className = 'card';

        const topDiv = document.createElement('div');
        topDiv.classList = 'card-text item-name';
        const fake = document.createElement('span')
        fake.style.marginLeft = '5px';

        const name = document.createElement('label');
        name.classList = 'card-label bold'
        name.innerText = d.name;

        const toolTip = document.createElement('div');
        toolTip.classList = 'tooltip help';
        const material = document.createElement('span');
        material.classList = 'material-icons md-48';
        material.style.fontSize = 'large';
        material.innerText = 'help';

        
    })
}