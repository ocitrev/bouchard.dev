'use strict';

let words = null;
const MAX_RESULTS = 100;

async function fetchWords() {
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
  words = await fetchWords();
  const today = new Date().getDate().toString();
  const savedDate = window.localStorage.getItem('date');
  const resetLocalStorage = today !== savedDate;

  document.querySelectorAll('input').forEach(txt => {
    if (resetLocalStorage) {
      window.localStorage.removeItem(txt.id);
    }

    txt.addEventListener('input', async e => {
      const data = getLettersOnly(e.target.value);
      window.localStorage.setItem(e.target.id, data);
      window.localStorage.setItem('date', today);
      e.target.value = data;
      await solve();
    });

    // txt.addEventListener('focus', e => {
    //   console.log(e);
    //   txt.select();
    // });

    // reload if it is the same day
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

  await solve();
}

function hasAny(letters, word) {
  for (let letter of letters) {
    if (word.match(new RegExp(letter, 'i'))) {
      return true;
    }
  }

  return false;
}

function hasAll(letters, word) {
  for (let letter of letters) {
    if (!word.match(new RegExp(letter, 'i'))) {
      return false;
    }
  }

  return true;
}

function filter() {
  const unwanted = getLettersOnly(document.getElementById('unwanted').value);

  const letters = [
    [document.getElementById('not_letter_1').value, document.getElementById('letter_1').value],
    [document.getElementById('not_letter_2').value, document.getElementById('letter_2').value],
    [document.getElementById('not_letter_3').value, document.getElementById('letter_3').value],
    [document.getElementById('not_letter_4').value, document.getElementById('letter_4').value],
    [document.getElementById('not_letter_5').value, document.getElementById('letter_5').value],
  ].map(a => a.map(getLettersOnly))

  // deduce wanted letters from the filters
  const wanted = Array.from(new Set(letters.flat().filter(x => !!x).join('')));

  const pattern = new RegExp(letters.flatMap(l => {
    if (l[1]) {
      return l[1];
    } else if (l[0]) {
      return `[^${l[0]}]`;
    }
    return '.';
  }).join(''), 'i');

  return words.filter(word => hasAll(wanted, word)
    && !hasAny(unwanted, word)
    && word.match(pattern)
  );
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

function getResultText(nbMatches) {
  let labelText;
  let iconPrefix;

  if (nbMatches == 0) {
    iconPrefix = '❌';
    labelText = 'No matches.';
  } else if (nbMatches == 1) {
    iconPrefix = '🎉';
    labelText = 'Nice!';
  } else if (nbMatches > 1) {
    labelText = `Found ${nbMatches} matches`;
    if (nbMatches > MAX_RESULTS) {
      labelText += `. Showing ${MAX_RESULTS} random results`;
      iconPrefix = '💡'
    } else {
      iconPrefix = '✅'
    }
    labelText += '.';
  }

  return `${iconPrefix} ${labelText}`;
}

async function solve() {
  const allResults = filter();
  document.getElementById('result_header').textContent = getResultText(allResults.length);
  const results = sample(allResults, MAX_RESULTS);
  const list = document.getElementById('results');
  list.textContent = '';
  results.forEach(w => list.appendChild(createResult(w)));
}

window.addEventListener('load', load);
