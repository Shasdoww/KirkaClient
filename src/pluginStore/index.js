document.addEventListener('DOMContentLoaded', () => {
    makeCollapsible();
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

    const lables = document.getElementsByClassName('card');
    for (let i = 0; i < coll.length; i++) {
        const label = lables[i];
        const child = label.getElementsByClassName('card-text');
        console.log(child);
        label.addEventListener('mouseenter', () => {
            for (const ch of child) {
                console.log(ch.id);
                $(`#${ch.id}`).trigger('mouseenter');
            }
        });
        label.addEventListener('mouseleave', () => {
            for (const ch of child)
                ch.style.display = 'none';
        });
    }
}
