document.addEventListener('DOMContentLoaded', () => {
    makeCollapsible();
    $.ajax({
        url: 'http://127.0.0.1:5000/api/plugins',
        complete: (res) => {
            const data = res.responseJSON;
            console.log(data);
            paintCards(data);
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
        const fake = document.createElement('span');
        fake.style.marginLeft = '5px';

        const name = document.createElement('label');
        name.classList = 'card-label bold';
        name.innerText = `${d.name} v${d.ver}`;

        const toolTip = document.createElement('div');
        toolTip.classList = 'tooltip help';
        const material = document.createElement('span');
        material.classList = 'material-icons md-48';
        material.style.fontSize = 'large';
        material.innerText = 'help';
        const desc = document.createElement('span');
        desc.classList = 'tooltiptext tooltip-top';
        desc.innerText = d.desc;
        toolTip.appendChild(material);
        toolTip.appendChild(desc);

        topDiv.appendChild(fake);
        topDiv.appendChild(name);
        topDiv.appendChild(toolTip);

        const image = document.createElement('div');
        image.style.backgroundImage = `url('${d.img}')`;
        image.className = 'card-image';

        const bottomDiv = document.createElement('div');
        bottomDiv.classList = 'card-text bottom';
        const dlCount = document.createElement('label');
        dlCount.className = 'util';
        dlCount.innerText = `${d.dls} Downloads`;
        const dlBtn = document.createElement('button');
        dlBtn.classList = 'util download';
        dlBtn.innerText = 'Download';

        bottomDiv.appendChild(dlCount);
        bottomDiv.appendChild(dlBtn);

        card.appendChild(topDiv);
        card.appendChild(image);
        card.appendChild(bottomDiv);

        document.getElementsByClassName('frame-content')[0].appendChild(card);
    });
}
