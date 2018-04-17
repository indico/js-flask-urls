// Import the URL builder for the `user` endpoint
import buildUserURL from 'flask-url:user';


const $$ = document.querySelector.bind(document);
const nameField = $$('#name');
const urlField = $$('#output');

const reset = () => {
    nameField.value = '';
    nameField.dispatchEvent(new Event('input'));
};

$$('#name').addEventListener('input', (evt) => {
    // We remove slashes since we are not using a '<path:...>' placeholder
    const name = evt.target.value.trim().replace(/\//g, '-');
    urlField.value = buildUserURL({name});
});

$$('#go').addEventListener('click', () => {
    location.href = urlField.value;
});

$$('#reset').addEventListener('click', reset);
reset();
