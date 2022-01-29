'use strict';

let words = null;
const max_results = 100;

async function fetch_words() {
  const options = {
    credentials: 'same-origin'
  };

  return await fetch('5-letters.txt', options)
    .then(response => response.text())
    .then(data => data.split(/\r?\n/));
}

function getLettersOnly(text) {
  return text.replaceAll(/[^a-z]/ig, '');
}

async function load() {
  words = await fetch_words();

  document.querySelectorAll('input').forEach(txt => {
    txt.addEventListener('input', e => {
      const data = getLettersOnly(e.target.value);
      window.localStorage.setItem(e.target.id, data);
      e.target.value = data;
      solve();
    });

    // txt.addEventListener('focus', e => {
    //   console.log(e);
    //   txt.select();
    // });

    const savedText = window.localStorage.getItem(txt.id);
    if (savedText) {
      txt.value = savedText;
    }

    txt.addEventListener('keypress', e => {
      if (!e.key.match(/^[a-zA-Z]$/)) {
        e.preventDefault();
      }
    });

  });

  // document.querySelectorAll('.letter').forEach(txt => {
  //   txt.addEventListener('keydown', e => {

  //     const prev = () => {
  //       if (txt.previousElementSibling) {
  //         setTimeout(() => { txt.previousElementSibling.focus(); }, 0)
  //       }
  //     };

  //     const next = () => {
  //       if (txt.nextElementSibling) {
  //         setTimeout(() => { txt.nextElementSibling.focus(); }, 0)
  //       }
  //     };

  //     if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
  //       prev();
  //     } else if (e.key === 'ArrowRight' && txt.nextElementSibling) {
  //       next();
  //     } else if (e.key.match(/^[a-zA-Z]$/)) {
  //       next();
  //     }
  //   });
  // });

  solve();
}

function has_any(letters, word) {
  for (let letter of letters) {
    if (word.match(new RegExp(letter, 'i'))) {
      return true;
    }
  }

  return false;
}

function has_all(letters, word) {
  for (let letter of letters) {
    if (!word.match(new RegExp(letter, 'i'))) {
      return false;
    }
  }

  return true;
}

function filter() {
  const unwanted = getLettersOnly(document.getElementById('unwanted').value);
  const wanted = getLettersOnly(document.getElementById('wanted').value);

  const letters = [
    [document.getElementById('not_letter_1').value, document.getElementById('letter_1').value],
    [document.getElementById('not_letter_2').value, document.getElementById('letter_2').value],
    [document.getElementById('not_letter_3').value, document.getElementById('letter_3').value],
    [document.getElementById('not_letter_4').value, document.getElementById('letter_4').value],
    [document.getElementById('not_letter_5').value, document.getElementById('letter_5').value],
  ].map(a => { return a.map(getLettersOnly); })

  const pattern = new RegExp(letters.map(l => {
    if (l[1]) {
      return l[1];
    } else if (l[0]) {
      return '[^' + l[0] + ']';
    } else {
      return '.';
    }
  }).join(''), 'i');

  return words.filter(word => {
    return has_all(wanted, word)
      && !has_any(unwanted, word)
      && word.match(pattern)
  });
}

function createResult(text) {
  const result = document.createElement('li');
  result.textContent = text;
  return result;
}

function sample(array, n) {
  if (array.length > n) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n).sort();
  }

  return array;
}

function solve() {
  const all_results = filter();

  const list = document.getElementById('results');
  list.textContent = '';

  const label = document.createElement('div');
  let label_text = 'Found ' + all_results.length + ' match';

  if (all_results.length > 1) {
    label_text += 'es';

    if (all_results.length > max_results) {
      label_text += '. Showing ' + max_results + ' random results';
    }
  }

  label_text += '.';
  document.getElementById('result_header').textContent = label_text;

  const results = sample(all_results, max_results);
  results.forEach(w => list.appendChild(createResult(w)));
}

window.addEventListener('load', load);
